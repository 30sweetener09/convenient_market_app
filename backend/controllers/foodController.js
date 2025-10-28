// controllers/foodController.js
import { supabase } from "../db.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload image buffer to Supabase Storage and return public URL
 */
const uploadImage = async (file) => {
  if (!file || !file.buffer) return null;

  const mime = file.mimetype || "image/jpeg";
  const ext = (mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const fileName = `food-images/${uuidv4()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("food-images")
    .upload(fileName, file.buffer, { contentType: mime, upsert: false });

  if (uploadError) {
    console.error("Image upload error:", uploadError.message);
    return null;
  }

  const { data: publicData } = await supabase.storage
    .from("food-images")
    .getPublicUrl(fileName);

  return publicData?.publicUrl || null;
};

/**
 * CREATE FOOD
 * POST /food
 * Body: { name, categoryName, unitName, groupId? }, optional file: image
 */
export const createFood = async (req, res) => {
  try {
    const { name, categoryName, unitName, groupId } = req.body;
    const user = req.user;

    if (!name || !categoryName || !unitName) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing required fields (name, categoryName, unitName)",
          vn: "Thiếu thông tin bắt buộc (tên, danh mục, đơn vị)",
        },
        resultCode: "400",
      });
    }

    const gId = groupId || user?.groupId;
    if (!gId) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing groupId",
          vn: "Thiếu groupId",
        },
        resultCode: "400",
      });
    }

    // Kiểm tra trùng tên trong group
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

    // Tìm category & unit
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

    // Upload ảnh (nếu có)
    const imageUrl = await uploadImage(req.file);

    const { data, error } = await supabase
      .from("foods")
      .insert([
        {
          name: name.trim(),
          category_id: category.id,
          unit_id: unit.id,
          group_id: gId,
          image_url: imageUrl,
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
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
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * UPDATE FOOD
 * PUT /food
 * Body: { id, newName?, newCategory?, newUnit? }, optional file
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

    const { data: existing } = await supabase
      .from("foods")
      .select("*")
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

    const updateData = { updated_at: new Date().toISOString() };

    if (newName !== undefined) {
      if (!newName.trim()) {
        return res.status(400).json({
          resultMessage: {
            en: "Name cannot be empty",
            vn: "Tên không được để trống",
          },
          resultCode: "400",
        });
      }
      updateData.name = newName.trim();
    }

    if (newCategory !== undefined) {
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
          resultCode: "404",
        });
      }
      updateData.category_id = category.id;
    }

    if (newUnit !== undefined) {
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
          resultCode: "404",
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
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * DELETE FOOD
 * DELETE /food
 * Body: { id }
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
        resultCode: "404",
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
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET ALL FOODS (by group)
 * GET /food?groupId=...
 */
export const getFoodsByGroup = async (req, res) => {
  try {
    const user = req.user;
    const groupId = req.query.groupId || user?.groupId;

    if (!groupId) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing groupId",
          vn: "Thiếu groupId",
        },
        resultCode: "400",
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
 * GET FOOD BY ID
 * GET /food/:id
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
