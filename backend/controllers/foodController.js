// controllers/foodController.js
import { supabase } from "../db.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload image buffer to Supabase Storage and return public URL
 */
const uploadImage = async (file) => {
  if (!file ||!file.buffer) return null;

  const mime = file.mimetype || "image/jpeg";
  const ext = (mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const fileName = `food-images/${uuidv4()}.${ext}`;

  const { error: uploadError } = await supabase.storage
   .from("food-images")
   .upload(fileName, file.buffer, { contentType: mime, upsert: false });

  if (uploadError) {
    console.error("Image upload error:", uploadError.message);
    // 00158: đăng tải ảnh thất bại
    return null; 
  }

  const { data: publicData } = await supabase.storage
   .from("food-images")
   .getPublicUrl(fileName);

  return publicData?.publicUrl || null;
};

/**
 * @swagger
 * /food:
 *   post:
 *     summary: Tạo thực phẩm (Food) mới
 *     tags: [Food]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, description: "Tên thực phẩm (00148)." }
 *               categoryName: { type: string, description: "Tên danh mục (00149)." }
 *               unitName: { type: string, description: "Tên đơn vị (00150)." }
 *               groupId: { type: string, description: "GroupID nếu không dùng user context (optional)." }
 *               image: { type: string, format: binary, description: "File ảnh (00158)." }
 *     responses:
 *       200:
 *         description: Tạo thực phẩm thành công (00160)
 *       400:
 *         description: Thiếu trường bắt buộc (400) hoặc Thiếu Group ID (400)
 *       403:
 *         description: Chưa vào nhóm (00156 X)
 *       404:
 *         description: Category/Unit không tìm thấy (00155/00153)
 *       409:
 *         description: Tên thực phẩm đã tồn tại trong nhóm (00151)
 *       500:
 *         description: Lỗi máy chủ (00152) hoặc Upload ảnh thất bại (00158)
 */
export const createFood = async (req, res) => {
  try {
    const { name, categoryName, unitName, groupId } = req.body;
    const user = req.user;

    if (!name ||!categoryName ||!unitName) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing required fields (name, categoryName, unitName)",
          vn: "Thiếu thông tin bắt buộc (tên, danh mục, đơn vị)",
        },
        resultCode: "400",
      });
    }

    const gId = groupId || user?.groupId;
    // 00156 X: Hãy vào nhóm trước để tạo thực phẩm
    if (!gId) { 
      return res.status(403).json({
        resultMessage: {
          en: "Must belong to a group to create food",
          vn: "Hãy vào nhóm trước để tạo thực phẩm",
        },
        resultCode: "00156 X",
      });
    }

    // Kiểm tra trùng tên trong group (00151)
    const { data: existing } = await supabase
     .from("foods")
     .select("id")
     .eq("group_id", gId)
     .eq("name", name.trim())
     .maybeSingle();

    if (existing) {
      return res.status(409).json({
        resultMessage: {
          en: "Food already exists in this group",
          vn: "Thực phẩm đã tồn tại trong nhóm này",
        },
        resultCode: "00151",
      });
    }

    // Tìm category & unit (00155, 00153)
    const { data: category } = await supabase
     .from("categories")
     .select("id")
     .eq("name", categoryName)
     .maybeSingle();

    if (!category) {
      return res.status(404).json({
        resultMessage: {
          en: "Category not found",
          vn: "Không tìm thấy danh mục",
        },
        resultCode: "00155",
      });
    }

    const { data: unit } = await supabase
     .from("units")
     .select("id")
     .eq("unit_name", unitName)
     .maybeSingle();

    if (!unit) {
      return res.status(404).json({
        resultMessage: {
          en: "Unit not found",
          vn: "Không tìm thấy đơn vị",
        },
        resultCode: "00153",
      });
    }

    // Upload ảnh (nếu có) (00158)
    const imageUrl = await uploadImage(req.file);
    if (!req.file && imageUrl === null && req.file!== undefined) {
        // Only return 00158 if file was provided but upload failed
        return res.status(500).json({
            resultMessage: {
                en: "Image upload failed",
                vn: "đăng tải ảnh thất bại",
            },
            resultCode: "00158",
        });
    }

    const { data, error } = await supabase
     .from("foods")
     .insert()
     .select()
     .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Food created successfully",
        vn: "Thêm thực phẩm thành công",
      },
      resultCode: "00160",
      newFood: data,
    });
  } catch (err) {
    console.error("Error creating food:", err.message);
    res.status(500).json({ error: "Internal server error", resultCode: "00152" });
  }
};

/**
 * @swagger
 * /food:
 *   put:
 *     summary: Cập nhật thực phẩm (Food)
 *     tags: [Food]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: string, description: "ID thực phẩm cần cập nhật." }
 *               newName: { type: string, description: "Tên mới (optional)." }
 *               newCategory: { type: string, description: "Tên danh mục mới (optional)." }
 *               newUnit: { type: string, description: "Tên đơn vị mới (optional)." }
 *               image: { type: string, description: "URL ảnh mới (optional) / Có thể dùng multipart-form cho file." }
 *     responses:
 *       200:
 *         description: Cập nhật thực phẩm thành công (00178)
 *       400:
 *         description: Thiếu ID (400) hoặc Tên không hợp lệ (400)
 *       403:
 *         description: Không có quyền chỉnh sửa (00167 X)
 *       404:
 *         description: Food không tìm thấy (404) hoặc Category/Unit mới không tìm thấy (404)
 *       409:
 *         description: Tên mới đã tồn tại (00173)
 *       500:
 *         description: Lỗi máy chủ
 */
export const updateFood = async (req, res) => {
  try {
    const { id, newName, newCategory, newUnit } = req.body;
    const user = req.user;

    if (!id) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing food id",
          vn: "Thiếu id của thực phẩm",
        },
        resultCode: "400",
      });
    }

    // Check if any update field is provided
    if (!newName &&!newCategory &&!newUnit &&!req.file) {
        // 00163: Vui lòng cung cấp ít nhất một trong các trường sau
        return res.status(400).json({
            resultMessage: {
                en: "Please provide at least one field to update",
                vn: "Vui lòng cung cấp ít nhất một trường cần cập nhật",
            },
            resultCode: "00163",
        });
    }

    const { data: existing } = await supabase
     .from("foods")
     .select("id, group_id")
     .eq("id", id)
     .maybeSingle();

    if (!existing || existing.group_id!== user?.groupId) {
      return res.status(404).json({
        resultMessage: {
          en: "Food not found",
          vn: "Không tìm thấy thực phẩm",
        },
        resultCode: "00166",
      });
    }
    
    // Authorization Check (00167 X) - Assuming Middleware handles this and we only proceed if Admin/Owner

    const updateData = { updated_at: new Date().toISOString() };

    if (newName!== undefined) {
      if (!newName.trim()) {
        return res.status(400).json({
          resultMessage: {
            en: "Name cannot be empty",
            vn: "Tên không được để trống",
          },
          resultCode: "400",
        });
      }
      // Check if newName already exists in group (00173)
      const { data: duplicateName } = await supabase
       .from("foods")
       .select("id")
       .eq("group_id", existing.group_id)
       .eq("name", newName.trim())
       .maybeSingle();

      if (duplicateName && duplicateName.id!== id) {
          return res.status(409).json({
              resultMessage: {
                  en: "A food with this new name already exists in the group",
                  vn: "Một thực phẩm với tên này đã tồn tại",
              },
              resultCode: "00173",
          });
      }
      updateData.name = newName.trim();
    }

    if (newCategory!== undefined) {
      const { data: category } = await supabase
       .from("categories")
       .select("id")
       .eq("name", newCategory)
       .maybeSingle();
      if (!category) {
        return res.status(404).json({
          resultMessage: {
            en: "Category not found",
            vn: "Không tìm thấy danh mục",
          },
          resultCode: "00171",
        });
      }
      updateData.category_id = category.id;
    }

    if (newUnit!== undefined) {
      const { data: unit } = await supabase
       .from("units")
       .select("id")
       .eq("unit_name", newUnit)
       .maybeSingle();
      if (!unit) {
        return res.status(404).json({
          resultMessage: {
            en: "Unit not found",
            vn: "Không tìm thấy đơn vị",
          },
          resultCode: "00169",
        });
      }
      updateData.unit_id = unit.id;
    }

    // Nếu có ảnh mới
    const newImageUrl = await uploadImage(req.file);
    if (newImageUrl) {
      updateData.image_url = newImageUrl;
    }

    const { data, error } = await supabase
     .from("foods")
     .update(updateData)
     .eq("id", id)
     .select()
     .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Food updated successfully",
        vn: "Cập nhật thực phẩm thành công",
      },
      resultCode: "00178",
      updatedFood: data,
    });
  } catch (err) {
    console.error("Error updating food:", err.message);
    res.status(500).json({ error: "Internal server error", resultCode: "00168" });
  }
};

/**
 * @swagger
 * /food:
 *   delete:
 *     summary: Xóa thực phẩm (Food)
 *     tags: [Food]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: string, description: "ID thực phẩm cần xóa." }
 *     responses:
 *       200:
 *         description: Xóa thực phẩm thành công (00184)
 *       400:
 *         description: Thiếu ID (400)
 *       403:
 *         description: Không có quyền chỉnh sửa (00167 X)
 *       404:
 *         description: Food không tìm thấy (404)
 *       409:
 *         description: Vi phạm ràng buộc (Vẫn có Fridge Item/Recipe tham chiếu) (00181)
 *       500:
 *         description: Lỗi máy chủ
 */
export const deleteFood = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing food id",
          vn: "Thiếu id của thực phẩm",
        },
        resultCode: "400",
      });
    }

    const { data: existing } = await supabase
     .from("foods")
     .select("id")
     .eq("id", id)
     .maybeSingle();

    if (!existing) {
      return res.status(404).json({
        resultMessage: {
          en: "Food not found",
          vn: "Không tìm thấy thực phẩm",
        },
        resultCode: "00180",
      });
    }
    
    // Check FK Constraint (Fridge Item) (00181)
    const { count: fridgeCount } = await supabase
       .from("fridge_items")
       .select("id", { count: 'exact' })
       .eq("food_id", id);
        
    if (fridgeCount > 0) {
        return res.status(409).json({
            resultMessage: {
                en: "Cannot delete food due to existing fridge item references",
                vn: "Không thể xóa Food. Vẫn có mục trong tủ lạnh đang tham chiếu.",
            },
            resultCode: "00181",
        });
    }

    const { error } = await supabase.from("foods").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Food deleted successfully",
        vn: "Xóa thực phẩm thành công",
      },
      resultCode: "00184",
    });
  } catch (err) {
    console.error("Error deleting food:", err.message);
    res.status(500).json({ error: "Internal server error", resultCode: "00168" });
  }
};

/**
 * @swagger
 * /food:
 *   get:
 *     summary: Lấy tất cả thực phẩm (Food) trong nhóm
 *     tags: [Food]
 *     security:
 *       - bearerAuth:
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: "ID nhóm (optional), nếu không cung cấp sẽ dùng groupId của user."
 *     responses:
 *       200:
 *         description: Lấy danh sách thực phẩm thành công (00188)
 *       400:
 *         description: Thiếu Group ID (400)
 *       403:
 *         description: Bạn chưa vào nhóm nào (00185)
 *       500:
 *         description: Lỗi máy chủ
 */
export const getFoodsByGroup = async (req, res) => {
  try {
    const user = req.user;
    const groupId = req.query.groupId || user?.groupId;

    if (!groupId) {
        // 00185: Bạn chưa vào nhóm nào
      return res.status(403).json({
        resultMessage: {
          en: "User does not belong to any group",
          vn: "Bạn chưa vào nhóm nào",
        },
        resultCode: "00185",
      });
    }

    const { data, error } = await supabase
     .from("foods")
     .select(
        `id, name, image_url, created_at, updated_at, 
         categories (id, name), 
         units (id, unit_name)`
      )
     .eq("group_id", groupId)
     .order("name", { ascending: true });

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Get food list successfully",
        vn: "Lấy danh sách thực phẩm thành công",
      },
      resultCode: "00188",
      foods: data,
    });
  } catch (err) {
    console.error("Error fetching foods:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /food/{id}:
 *   get:
 *     summary: Lấy chi tiết thực phẩm (Food) theo ID
 *     tags: [Food]
 *     security:
 *       - bearerAuth:
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID thực phẩm cần lấy."
 *     responses:
 *       200:
 *         description: Lấy chi tiết thực phẩm thành công (00178)
 *       404:
 *         description: Food không tìm thấy (404)
 *       500:
 *         description: Lỗi máy chủ
 */
export const getFoodById = async (req, res) => {
  try {
    const id = req.params.id;

    const { data, error } = await supabase
     .from("foods")
     .select(
        `*, 
         categories (id, name),
         units (id, unit_name)`
      )
     .eq("id", id)
     .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        resultMessage: {
          en: "Food not found",
          vn: "Không tìm thấy thực phẩm",
        },
        resultCode: "404",
      });
    }

    res.status(200).json({
      resultMessage: {
        en: "Get food detail successfully",
        vn: "Lấy chi tiết thực phẩm thành công",
      },
      resultCode: "00178",
      food: data,
    });
  } catch (err) {
    console.error("Error fetching food by id:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
