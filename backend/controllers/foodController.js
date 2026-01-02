// controllers/foodController.js
import { supabase } from "../db.js";
import { v4 as uuidv4 } from "uuid";

// --- Helper: Upload ảnh lên Supabase Storage ---
const uploadImage = async (file) => {
  if (!file || !file.buffer) return null;
  
  // Xử lý đuôi file
  const mime = file.mimetype || "image/jpeg";
  const ext = (mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const fileName = `food_images/${uuidv4()}.${ext}`;

  // Upload
  const { error } = await supabase.storage.from("imageurl").upload(fileName, file.buffer, { contentType: mime });
  if (error) {
      console.error("Supabase Upload Error:", error);
      return null;
  }
  
  // Lấy Public URL
  const { data } = supabase.storage.from("imageurl").getPublicUrl(fileName);
  return data?.publicUrl || null;
};

/**
 * @swagger
 * /food/create:
 *   post:
 *     summary: Tạo thực phẩm
 *     description: Tạo thực phẩm mới
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, foodCategoryName, unitName, image]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên thực phẩm
 *                 example: "Thịt bò"
 *               foodCategoryName:
 *                 type: string
 *                 description: Tên danh mục
 *                 example: "Bữa trưa"
 *               unitName:
 *                 type: string
 *                 description: Tên đơn vị
 *                 example: "Kg"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh thực phẩm
 *     responses:
 *       200:
 *         description: Tạo thực phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en: { type: string, example: "Food creation successful" }
 *                     vn: { type: string, example: "Tạo thực phẩm thành công" }
 *                 resultCode: { type: string, example: "00160" }
 *                 newFood:
 *                   type: object
 *                   properties:
 *                     imageUrl: { type: string }
 *                     type: { type: string, example: "ingredient" }
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     UnitOfMeasurementId: { type: integer }
 *                     FoodCategoryId: { type: integer }
 *                     UserId: { type: integer }
 *                     updatedAt: { type: string }
 *                     createdAt: { type: string }
 */
export const createFood = async (req, res) => {
  try {
    const { name, foodCategoryName, unitName, type } = req.body;
    const user = req.user;

    // ---------------------------------------------------------
    // 1. VALIDATION: Kiểm tra các trường bắt buộc (Bao gồm cả FILE)
    // ---------------------------------------------------------
    if (!name || !foodCategoryName || !unitName || !req.file) {
      return res.status(200).json({
        resultMessage: { 
          en: "Please provide all required fields!", 
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc!", 
        },
        resultCode: "00147",
      });
    }

    // ---------------------------------------------------------
    // 2. XỬ LÝ LOẠI THỰC PHẨM (TYPE)
    // Nếu client không gửi, mặc định là 'Ingredient'.
    // Nếu gửi 'Meal' (không phân biệt hoa thường) -> 'Meal', ngược lại -> 'Ingredient'
    // ---------------------------------------------------------
    let finalType = 'Ingredient';
    if (type && type.trim().toLowerCase() === 'Meal') {
        finalType = 'Meal';
    }

    // ---------------------------------------------------------
    // 3. KIỂM TRA TRÙNG TÊN (Trong phạm vi User này)
    // ---------------------------------------------------------
    const { data: existing } = await supabase
      .from("food")
      .select("id")
      .eq("userid", user.id)
      .eq("name", name.trim())
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        resultMessage: { 
          en: "Food with this name already exists", 
          vn: "Đã tồn tại thức ăn với tên này", 
        },
        resultCode: "00151",
      });
    }

    // ---------------------------------------------------------
    // 4. TÌM CATEGORY ID
    // ---------------------------------------------------------
    const { data: category } = await supabase
      .from("foodcategory")
      .select("id")
      .ilike("name", foodCategoryName.trim())
      .maybeSingle();
      
    if (!category) {
        return res.status(200).json({
            resultMessage: { 
              en: "Category not found with provided name", 
              vn: "Không tìm thấy category với tên cung cấp", 
            },
            resultCode: "00155",
        });
    }

    // ---------------------------------------------------------
    // 5. TÌM UNIT ID
    // ---------------------------------------------------------
    const { data: unit } = await supabase
      .from("unitofmeasurement")
      .select("id")
      .ilike("unitname", unitName.trim())
      .maybeSingle();

    if (!unit) {
        return res.status(200).json({
            resultMessage: { 
              en: "Unit not found with provided name", 
              vn: "Không tìm thấy đơn vị với tên cung cấp", 
            },
            resultCode: "00153",
        });
    }

    // ---------------------------------------------------------
    // 6. UPLOAD ẢNH & KIỂM TRA LỖI UPLOAD
    // ---------------------------------------------------------
    const imageUrl = await uploadImage(req.file);
    
    if (!imageUrl) {
        return res.status(200).json({
            resultMessage: {
                en: "Image upload failed",
                vn: "Đăng tải ảnh thất bại"
            },
            resultCode: "00158"
        });
    }

    // ---------------------------------------------------------
    // 7. INSERT VÀO DATABASE
    // ---------------------------------------------------------
    const { data, error } = await supabase
      .from("food")
      .insert({
        name: name.trim(),
        imageurl: imageUrl,             // Lưu URL ảnh từ Storage
        type: finalType,                // Lưu type ('Ingredient' hoặc 'Meal')
        foodcategoryid: category.id,    // ID của danh mục tìm được
        unitofmeasurementid: unit.id,   // ID của đơn vị tìm được
        userid: user.id,                // ID người dùng hiện tại
      })
      .select()
      .single();

    if (error) {
        throw error; // Ném lỗi xuống catch
    }

    // Trả về kết quả thành công
    return res.status(200).json({
      resultMessage: { 
        en: "Food creation successful", 
        vn: "Tạo thực phẩm thành công" 
      },
      resultCode: "00160",
      newFood: data,
    });

  } catch (err) {
    console.error("Create Food API Error:", err);
    return res.status(500).json({ 
        resultMessage: { 
            en: "Internal Server Error", 
            vn: "server error" // Theo đúng text trong ảnh tài liệu bạn gửi (00152)
        },
        resultCode: "00152" 
    });
  }
};


/**
 * @swagger
 * /food/update:
 *   put:
 *     summary: Cập nhật thực phẩm
 *     description: Cập nhật thông tin thực phẩm. Cần gửi ít nhất 1 trong các trường thay đổi (newName, newCategory, newUnit, image).
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên hiện tại của thực phẩm
 *                 example: "Thịt bò cũ"
 *               newName:
 *                 type: string
 *                 description: Tên mới (nếu muốn đổi tên)
 *                 example: "Thịt bò Wagyu"
 *               newCategory:
 *                 type: string
 *                 description: Tên mới của danh mục
 *                 example: "Thịt"
 *               newUnit:
 *                 type: string
 *                 description: Tên mới của đơn vị
 *                 example: "Kg"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh mới của thực phẩm
 *     responses:
 *       200:
 *         description: Trả về kết quả (Thành công hoặc Lỗi nghiệp vụ)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en: { type: string }
 *                     vn: { type: string }
 *                 resultCode: { type: string, example: "00178" }
 *                 food: { type: object }
 */
export const updateFood = async (req, res) => {
  try {
    const { name, newName, newCategory, newUnit } = req.body;
    const user = req.user;

    // 1. VALIDATION: Kiểm tra tên thực phẩm đầu vào (Mã 00162)
    if (!name) {
      return res.status(200).json({ 
        resultMessage: { en: "Please provide valid food name!", vn: "Vui lòng cung cấp tên thực phẩm hợp lệ!" },
        resultCode: "00162" 
      });
    }

    // 2. VALIDATION: Kiểm tra xem có trường nào để update không (Mã 00163)
    // Nếu không gửi newName, newCategory, newUnit và cũng không gửi file -> Báo lỗi
    if (!newName && !newCategory && !newUnit && !req.file) {
       return res.status(200).json({
          resultMessage: { 
             en: "Please provide at least one field: newName, newCategory, newUnit", 
             vn: "Vui lòng cung cấp ít nhất một trong các trường sau, newName, newCategory, newUnit" 
          },
          resultCode: "00163"
       });
    }

    // 3. TÌM THỰC PHẨM CẦN SỬA (Mã 00167)
    const { data: existing } = await supabase
      .from("food")
      .select("id, userid")
      .eq("userid", user.id)
      .eq("name", name.trim())
      .maybeSingle();

    if (!existing) {
        return res.status(200).json({
            resultMessage: { en: "Food not found", vn: "Thực phẩm với tên đã cung cấp không tồn tại" },
            resultCode: "00167",
        });
    }

    // Object chứa dữ liệu sẽ update
    const updateData = { updatedat: new Date().toISOString() }; // Lưu ý: updatedat viết thường

    // 4. XỬ LÝ ĐỔI TÊN (newName) & CHECK TRÙNG (Mã 00173)
    if (newName && newName.trim() !== name.trim()) {
        const { data: duplicate } = await supabase
            .from("food")
            .select("id")
            .eq("userid", user.id)
            .eq("name", newName.trim())
            .maybeSingle();

        if (duplicate) {
            return res.status(200).json({
                resultMessage: { en: "Food with this name already exists", vn: "Một thực phẩm với tên này đã tồn tại" },
                resultCode: "00173"
            });
        }
        updateData.name = newName.trim();
    }

    // 5. XỬ LÝ CATEGORY (Mã 00171)
    if (newCategory) {
        const { data: cat } = await supabase
            .from("foodcategory")
            .select("id")
            .ilike("name", newCategory.trim())
            .maybeSingle();

        if (!cat) {
            return res.status(200).json({
                resultMessage: { en: "Category not found", vn: "Không tìm thấy danh mục với tên đã cung cấp" },
                resultCode: "00171" 
            });
        }
        updateData.foodcategoryid = cat.id; // Lưu ý: viết thường tên cột
    }

    // 6. XỬ LÝ UNIT (Mã 00169)
    if (newUnit) {
        const { data: un } = await supabase
            .from("unitofmeasurement")
            .select("id")
            .ilike("unitname", newUnit.trim())
            .maybeSingle();

        if (!un) {
            return res.status(200).json({ 
                resultMessage: { en: "Unit not found", vn: "Không tìm thấy đơn vị với tên đã cung cấp" },
                resultCode: "00169" 
            });
        }
        updateData.unitofmeasurementid = un.id; // Lưu ý: viết thường tên cột
    }

    // 7. XỬ LÝ ẢNH
    if (req.file) {
        const url = await uploadImage(req.file);
        if (url) updateData.imageurl = url;
    }

    // 8. UPDATE VÀO DB (Mã 00178)
    const { data, error } = await supabase
       .from("food")
       .update(updateData)
       .eq("id", existing.id)
       .select()
       .single();
    
    if (error) throw error;

    res.status(200).json({
        resultMessage: { en: "Successfully", vn: "Thành công" },
        resultCode: "00178",
        food: data,
    });

  } catch (err) {
    console.error(err);
    // Mã 00168: server error
    res.status(500).json({ 
        resultMessage: { en: "Server error", vn: "server error" },
        resultCode: "00168" 
    });
  }
};

/**
 * @swagger
 * /food/delete:
 *   delete:
 *     summary: Xoá thực phẩm
 *     description: This HTTP DELETE request is used to delete a food item. Payload includes "name".
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên thực phẩm cần xoá
 *                 example: "Tes222dsdh"
 *     responses:
 *       200:
 *         description: Xoá thực phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en: { type: string, example: "Food deletion successfull" }
 *                     vn: { type: string, example: "Xóa thực phẩm thành công" }
 *                 resultCode: { type: string, example: "00184" }
 */
export const deleteFood = async (req, res) => {
    try {
        const { name } = req.body; // Payload uses Name
        const user = req.user;
        
        if (!name) return res.status(400).json({ resultCode: "00400" });

        // 1. Find by Name & Owner
        const { data: existing } = await supabase
          .from("food")
          .select("id, userid")
          .eq("userid", user.id)
          .eq("name", name.trim())
          .maybeSingle();

        if (!existing) return res.status(404).json({
            resultMessage: { en: "Food not found", vn: "Không tìm thấy thực phẩm" },
            resultCode: "00180",
        });

        // 2. Check Constraint
        const { count } = await supabase.from("fridge").select("id", {count: 'exact', head: true}).eq("FoodId", existing.id);
        if (count > 0) return res.status(409).json({
            resultMessage: { en: "Cannot delete food due to references", vn: "Không thể xóa Food. Vẫn có mục trong tủ lạnh đang tham chiếu." },
            resultCode: "00181",
        });

        // 3. Delete
        const { error } = await supabase.from("food").delete().eq("id", existing.id);
        if (error) throw error;

        res.status(200).json({
            resultMessage: { en: "Food deletion successfull", vn: "Xóa thực phẩm thành công" },
            resultCode: "00184",
        });
    } catch (err) {
        res.status(500).json({ resultCode: "00168" });
    }
};

/**
 * @swagger
 * /food/list:
 *   get:
 *     summary: Get all foods in group
 *     description: Lấy danh sách thực phẩm của nhóm mà user đang tham gia.
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en: { type: string }
 *                     vn: { type: string }
 *                 resultCode: { type: string, example: "00188" }
 *                 foods:
 *                   type: array
 */
export const getFoodsByGroup = async (req, res) => {
    try {
        const user = req.user;
        
        // 1. Xác định Group ID (Ưu tiên lấy từ User Context)
        const groupId = req.query.groupId || user?.groupId;

        if (!groupId) {
            return res.status(200).json({ // Trả 200 kèm mã lỗi nghiệp vụ
                resultMessage: { en: "User does not belong to any group", vn: "Bạn chưa vào nhóm nào" },
                resultCode: "00185", // Mã lỗi: Bạn chưa vào nhóm nào
            });
        }

        // 2. Query trực tiếp Food dựa trên User thuộc Group đó
        // Logic: Lấy tất cả Food mà người tạo (UserId) đang thuộc về Group có ID = groupId
        
        const { data, error } = await supabase
            .from("food")
            .select(`
                id, name, imageurl, type, createdat, updatedat, userid,
                unitofmeasurement:unitofmeasurementid ( id, unitname ),
                foodcategory:foodcategoryid ( id, name ),
                users!inner ( group_id ) 
            `)
            // !inner: Chỉ lấy những food mà user tạo ra food đó có group_id trùng khớp
            .eq("users.group_id", groupId) 
            .order("name", { ascending: true });

        if (error) throw error;

        // Map lại dữ liệu để trả về cấu trúc đẹp (phẳng hóa object nếu cần)
        const formattedFoods = data.map(item => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageurl,
            type: item.type,
            createdAt: item.createdat,
            updatedAt: item.updatedat,
            UserId: item.userid,
            UnitOfMeasurement: {
                id: item.unitofmeasurement?.id,
                unitName: item.unitofmeasurement?.unitname
            },
            FoodCategory: {
                id: item.foodcategory?.id,
                name: item.foodcategory?.name
            }
        }));

        return res.status(200).json({
            resultMessage: { en: "Successfull retrieve all foods", vn: "Lấy danh sách thực phẩm thành công" },
            resultCode: "00188",
            foods: formattedFoods,
        });

    } catch (err) {
        console.error("Get Foods Error:", err);
        return res.status(500).json({ 
            resultMessage: { en: "Server error", vn: "Lỗi máy chủ nội bộ" },
            resultCode: "00157" 
        });
    }
};

/**
 * @swagger
 * /food/unit:
 *   get:
 *     summary: Get units
 *     description: This endpoint retrieves a list of food units.
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved units
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en: { type: string, example: "Successfully retrieved units" }
 *                     vn: { type: string, example: "Lấy các unit thành công" }
 *                 resultCode: { type: string, example: "00110" }
 *                 units:
 *                   type: array
 *                   items:
 *                     type: object
 */
export const getUnits = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("unitofmeasurement")
            .select("*")
            .order("unitname", { ascending: true });

        if (error) throw error;

        res.status(200).json({
            resultMessage: { en: "Successfully retrieved units", vn: "Lấy các unit thành công" },
            resultCode: "00110",
            units: data
        });
    } catch (err) {
        console.error("Get Units Error:", err);
        res.status(500).json({ 
            resultMessage: { en: "Server error", vn: "server error" },
            resultCode: "00114" 
        });
    }
};

/**
 * @swagger
 * /food/category:
 *   get:
 *     summary: Get categories
 *     description: Truy xuất danh sách các danh mục thực phẩm
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en: { type: string, example: "Successfully retrieved categories" }
 *                     vn: { type: string, example: "Lấy các category thành công" }
 *                 resultCode: { type: string, example: "00129" }
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 */
export const getCategories = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("foodcategory")
            .select("*")
            .order("name", { ascending: true });

        if (error) throw error;

        res.status(200).json({
            resultMessage: { 
              en: "Successfully retrieved categories",
              vn: "Lấy các category thành công" 
            },
            resultCode: "00129",
            categories: data
        });
    } catch (err) {
        console.error("Get Categories Error:", err);
        res.status(500).json({ 
            resultMessage: { en: "Server error", vn: "server error" },
            resultCode: "00133" 
        });
    }
};
