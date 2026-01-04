import { supabase } from "../db.js";
import { v4 as uuidv4 } from "uuid";

// --- Helper: Upload ảnh lên Supabase Storage ---
const uploadImage = async (file) => {
  if (!file || !file.buffer) return null;
  
  // Validate Mimetype
  if (!file.mimetype.startsWith("image/")) {
      console.error("Invalid file type:", file.mimetype);
      return null;
  }

  const mime = file.mimetype || "image/jpeg";
  const ext = (mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const fileName = `food_images/${uuidv4()}.${ext}`;

  const { error } = await supabase.storage.from("imageurl").upload(fileName, file.buffer, { contentType: mime });
  if (error) {
      console.error("Supabase Upload Error:", error);
      return null;
  }
  
  const { data } = supabase.storage.from("imageurl").getPublicUrl(fileName);
  return data?.publicUrl || null;
};

/* ==========================================================================
   API: CREATE FOOD
   ========================================================================== */

/**
 * @swagger
 * /food:
 *   post:
 *     summary: Tạo thực phẩm mới
 *     description: Tạo món ăn vào danh sách cá nhân của User. Yêu cầu gửi form-data để upload ảnh.
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
 *                 description: Tên món ăn
 *                 example: "Thịt bò Kobe"
 *               foodCategoryName:
 *                 type: string
 *                 description: "Tên danh mục (Phải khớp với DB: Bữa sáng, Bữa trưa, Bữa tối...)"
 *                 example: "Bữa trưa"
 *               unitName:
 *                 type: string
 *                 description: "Đơn vị tính (Phải khớp với DB: Kilogram, Hộp, Lít...)"
 *                 example: "Kilogram"
 *               type:
 *                 type: string
 *                 description: Loại (Ingredient hoặc Meal)
 *                 example: "Ingredient"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh minh họa
 *     responses:
 *       200:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 resultCode: "00160"
 *                 resultMessage:
 *                   en: "Food creation successful"
 *                   vn: "Tạo thực phẩm thành công"
 *                 newFood:
 *                   id: 101
 *                   name: "Thịt bò Kobe"
 *                   imageUrl: "https://supabasestorage.../food_images/abc.jpg"
 *                   type: "Ingredient"
 *                   foodcategoryid: 1
 *                   unitofmeasurementid: 5
 *                   userid: "uuid-user-123"
 *       400:
 *         description: Thiếu thông tin
 *       409:
 *         description: Trùng tên món ăn
 */
export const createFood = async (req, res) => {
  try {
    const { name, foodCategoryName, unitName, type } = req.body;
    const user = req.user;

    // 1. Validate Input
    if (!name || !foodCategoryName || !unitName || !req.file) {
      return res.status(400).json({
        resultCode: "00147",
        resultMessage: { vn: "Vui lòng cung cấp đầy đủ thông tin (tên, danh mục, đơn vị, ảnh)" }
      });
    }

    // 2. Validate Type
    let finalType = 'Ingredient';
    if (type && type.trim().toLowerCase() === 'meal') finalType = 'Meal';

    // 3. Check trùng tên (Trong phạm vi User này)
    const { data: existing } = await supabase
      .from("food")
      .select("id")
      .eq("userid", user.id)
      .ilike("name", name.trim())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        resultCode: "00151",
        resultMessage: { vn: "Bạn đã tạo món ăn này rồi" }
      });
    }

    // 4. Find/Validate Category & Unit
    const { data: category } = await supabase.from("foodcategory").select("id").ilike("name", foodCategoryName.trim()).maybeSingle();
    if (!category) return res.status(404).json({ resultCode: "00155", resultMessage: { vn: "Danh mục không tồn tại" } });

    const { data: unit } = await supabase.from("unitofmeasurement").select("id").ilike("unitname", unitName.trim()).maybeSingle();
    if (!unit) return res.status(404).json({ resultCode: "00153", resultMessage: { vn: "Đơn vị tính không tồn tại" } });

    // 5. Upload Image
    const imageUrl = await uploadImage(req.file);
    if (!imageUrl) return res.status(500).json({ resultCode: "00158", resultMessage: { vn: "Lỗi upload ảnh" } });

    // 6. Insert
    const { data, error } = await supabase
      .from("food")
      .insert({
        name: name.trim(),
        imageurl: imageUrl,
        type: finalType,
        foodcategoryid: category.id,
        unitofmeasurementid: unit.id,
        userid: user.id, // UUID từ middleware userContext
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      resultCode: "00160",
      resultMessage: { vn: "Tạo thực phẩm thành công" },
      newFood: data
    });

  } catch (err) {
    console.error("Create Food Error:", err);
    return res.status(500).json({ resultCode: "00152" });
  }
};

/* ==========================================================================
   API: UPDATE FOOD (By ID)
   ========================================================================== */
/**
 * @swagger
 * /food:
 *   put:
 *     summary: Cập nhật thực phẩm
 *     description: Cập nhật thông tin món ăn dựa trên ID. Chỉ gửi những trường cần sửa.
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: integer
 *                 description: ID của món ăn cần sửa (BẮT BUỘC)
 *                 example: 101
 *               name:
 *                 type: string
 *                 description: Tên mới (nếu muốn đổi)
 *                 example: "Thịt bò Wagyu"
 *               categoryName:
 *                 type: string
 *                 description: Danh mục mới
 *                 example: "Thịt"
 *               unitName:
 *                 type: string
 *                 description: Đơn vị mới
 *                 example: "G"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh mới (nếu muốn đổi)
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 resultCode: "00178"
 *                 resultMessage:
 *                   en: "Update successful"
 *                   vn: "Cập nhật thành công"
 *                 food:
 *                   id: 101
 *                   name: "Thịt bò Wagyu"
 *                   updatedAt: "2024-01-05T12:00:00Z"
 *       404:
 *         description: Không tìm thấy món ăn hoặc không phải chủ sở hữu
 */
export const updateFood = async (req, res) => {
  try {
    const { id, name, categoryName, unitName } = req.body; // Input là ID và các trường cần sửa
    const user = req.user;

    if (!id) return res.status(400).json({ resultCode: "00162", resultMessage: { vn: "Thiếu ID món ăn" } });

    // 1. Tìm món ăn và đảm bảo nó thuộc về User này
    const { data: existing } = await supabase
      .from("food")
      .select("id, userid")
      .eq("id", id)
      .maybeSingle();

    if (!existing) return res.status(404).json({ resultCode: "00167", resultMessage: { vn: "Món ăn không tồn tại" } });
    
    // Check quyền sở hữu (Chỉ sửa được món mình tạo)
    if (existing.userid !== user.id) {
        return res.status(403).json({ resultCode: "00167", resultMessage: { vn: "Bạn không có quyền sửa món này" } });
    }

    const updateData = { updatedat: new Date().toISOString() };

    // 2. Xử lý logic từng trường
    // Tên
    if (name) {
        // Check trùng tên với món KHÁC của mình
        const { data: duplicate } = await supabase
            .from("food")
            .select("id")
            .eq("userid", user.id)
            .ilike("name", name.trim())
            .neq("id", id) // Loại trừ chính nó
            .maybeSingle();
        
        if (duplicate) return res.status(409).json({ resultCode: "00173", resultMessage: { vn: "Tên món ăn đã tồn tại" } });
        updateData.name = name.trim();
    }

    // Category
    if (categoryName) {
        const { data: cat } = await supabase.from("foodcategory").select("id").ilike("name", categoryName.trim()).maybeSingle();
        if (!cat) return res.status(404).json({ resultCode: "00171", resultMessage: { vn: "Danh mục không tồn tại" } });
        updateData.foodcategoryid = cat.id;
    }

    // Unit
    if (unitName) {
        const { data: un } = await supabase.from("unitofmeasurement").select("id").ilike("unitname", unitName.trim()).maybeSingle();
        if (!un) return res.status(404).json({ resultCode: "00169", resultMessage: { vn: "Đơn vị không tồn tại" } });
        updateData.unitofmeasurementid = un.id;
    }

    // Image
    if (req.file) {
        const url = await uploadImage(req.file);
        if (url) updateData.imageurl = url;
    }

    // 3. Update
    const { data, error } = await supabase
       .from("food")
       .update(updateData)
       .eq("id", id)
       .select()
       .single();
    
    if (error) throw error;

    return res.status(200).json({
        resultCode: "00178",
        resultMessage: { vn: "Cập nhật thành công" },
        food: data,
    });

  } catch (err) {
    console.error("Update Food Error:", err);
    return res.status(500).json({ resultCode: "00168" });
  }
};

/* ==========================================================================
   API: DELETE FOOD (By ID)
   ========================================================================== */
/**
 * @swagger
 * /food:
 *   delete:
 *     summary: Xoá thực phẩm
 *     description: Xoá món ăn khỏi danh sách cá nhân (Yêu cầu món đó không nằm trong bất kỳ tủ lạnh nào).
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: integer
 *                 description: ID của món ăn cần xóa
 *                 example: 101
 *     responses:
 *       200:
 *         description: Xoá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 resultCode: "00184"
 *                 resultMessage:
 *                   en: "Food deletion successfull"
 *                   vn: "Xóa thực phẩm thành công"
 *       409:
 *         description: Không thể xóa vì đang được sử dụng trong tủ lạnh
 */
export const deleteFood = async (req, res) => {
    try {
        const { id } = req.body;
        const user = req.user;
        
        if (!id) return res.status(400).json({ resultCode: "00400", resultMessage: { vn: "Thiếu ID món ăn" } });

        // 1. Tìm món ăn
        const { data: existing } = await supabase
          .from("food")
          .select("id, userid")
          .eq("id", id)
          .maybeSingle();

        if (!existing) return res.status(404).json({ resultCode: "00180", resultMessage: { vn: "Món ăn không tồn tại" } });
        if (existing.userid !== user.id) return res.status(403).json({ resultCode: "00180", resultMessage: { vn: "Không có quyền xóa món này" } });

        // 2. Check Constraint (Quan trọng: Check bảng fridge_food)
        // Kiểm tra xem món này có đang nằm trong bất kỳ tủ lạnh nào không
        const { count } = await supabase
            .from("fridge_food")
            .select("id", { count: 'exact', head: true })
            .eq("food_id", id);
        
        if (count > 0) {
            return res.status(409).json({
                resultCode: "00181",
                resultMessage: { vn: "Không thể xóa. Món ăn đang có trong tủ lạnh." },
            });
        }

        // 3. Delete
        const { error } = await supabase.from("food").delete().eq("id", id);
        if (error) throw error;

        return res.status(200).json({
            resultCode: "00184",
            resultMessage: { vn: "Xóa thực phẩm thành công" },
        });
    } catch (err) {
        console.error("Delete Food Error:", err);
        return res.status(500).json({ resultCode: "00168" });
    }
};

/* ==========================================================================
   API: GET ALL FOODS (Personal Dictionary)
   ========================================================================== */
/**
 * @swagger
 * /food:
 *   get:
 *     summary: Lấy danh sách thực phẩm của tôi
 *     description: Trả về danh sách tất cả món ăn do chính User hiện tại tạo ra.
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
 *               example:
 *                 resultCode: "00188"
 *                 resultMessage:
 *                   vn: "Lấy danh sách thực phẩm thành công"
 *                 foods:
 *                   - id: 101
 *                     name: "Thịt bò Kobe"
 *                     imageUrl: "https://..."
 *                     type: "Ingredient"
 *                     FoodCategory:
 *                       id: 1
 *                       name: "Thịt"
 *                     UnitOfMeasurement:
 *                       id: 5
 *                       unitName: "Kg"
 *                   - id: 102
 *                     name: "Rau cải thìa"
 *                     type: "Ingredient"
 */
export const getAllFoods = async (req, res) => {
    try {
        const user = req.user;
        
        // Chỉ lấy food do chính User này tạo (Private Dictionary)
        const { data, error } = await supabase
            .from("food")
            .select(`
                id, name, imageurl, type, createdat, updatedat, userid,
                unitofmeasurement:unitofmeasurementid ( id, unitname ),
                foodcategory:foodcategoryid ( id, name )
            `)
            .eq("userid", user.id) 
            .order("name", { ascending: true });

        if (error) throw error;

        // Map data (Flatten object)
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
            resultCode: "00188",
            resultMessage: { vn: "Lấy danh sách thực phẩm thành công" },
            foods: formattedFoods,
        });

    } catch (err) {
        console.error("Get All Foods Error:", err);
        return res.status(500).json({ resultCode: "00157" });
    }
};

/* ==========================================================================
   API: GET UNITS & CATEGORIES (Common)
   ========================================================================== */

/**
 * @swagger
 * /food/unit:
 *   get:
 *     summary: Lấy danh sách đơn vị đo
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
 *               example:
 *                 resultCode: "00110"
 *                 units:
 *                   - id: 1
 *                     unitname: "Kg"
 *                   - id: 2
 *                     unitname: "Lít"
 */
   export const getUnits = async (req, res) => {
    try {
        const { data, error } = await supabase.from("unitofmeasurement").select("*").order("unitname", { ascending: true });
        if (error) throw error;
        return res.status(200).json({ resultCode: "00110", units: data });
    } catch (err) { return res.status(500).json({ resultCode: "00114" }); }
};


/**
 * @swagger
 * /food/category:
 *   get:
 *     summary: Lấy danh sách danh mục
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
 *               example:
 *                 resultCode: "00129"
 *                 categories:
 *                   - id: 1
 *                     name: "Thịt"
 *                   - id: 2
 *                     name: "Hải sản"
 */
export const getCategories = async (req, res) => {
    try {
        const { data, error } = await supabase.from("foodcategory").select("*").order("name", { ascending: true });
        if (error) throw error;
        return res.status(200).json({ resultCode: "00129", categories: data });
    } catch (err) { return res.status(500).json({ resultCode: "00133" }); }
};


/* ==========================================================================
   API: GET FOOD BY NAME (Search)
   ========================================================================== */
/**
 * @swagger
 * /food/list/{foodName}:
 *   get:
 *     summary: Tìm kiếm chi tiết thực phẩm
 *     description: Tìm kiếm món ăn trong từ điển cá nhân theo tên.
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: foodName
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên món ăn cần tìm
 *         example: "Thịt bò Kobe"
 *     responses:
 *       200:
 *         description: Tìm thấy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 resultCode: "00189"
 *                 resultMessage:
 *                   vn: "Tìm thấy thực phẩm"
 *                 food:
 *                   id: 101
 *                   name: "Thịt bò Kobe"
 *                   imageUrl: "..."
 *       404:
 *         description: Không tìm thấy (00180)
 */
export const getFoodByName = async (req, res) => {
    try {
        const { foodName } = req.params;
        const user = req.user;

        // BỎ .maybeSingle() -> Để mặc định nó sẽ trả về mảng []
        const { data, error } = await supabase
            .from("food")
            .select(`
                id, name, imageurl, type, createdat, updatedat, userid,
                unitofmeasurement:unitofmeasurementid ( id, unitname ),
                foodcategory:foodcategoryid ( id, name )
            `)
            .eq("userid", user.id)
            .ilike("name", `%${foodName.trim()}%`) // Tìm gần đúng (có chứa từ khóa)
            .order("name", { ascending: true });

        if (error) throw error;

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
            resultCode: "00189",
            resultMessage: { vn: "Tìm thấy thực phẩm" },
            foods: formattedFoods, // Trả về mảng foods (số nhiều)
        });

    } catch (err) {
        console.error("Get Food By Name Error:", err);
        return res.status(500).json({ resultCode: "00187" });
    }
};