// controllers/adminController.js
import { supabase } from "../db.js";

// CATEGORY SECTION

/**
 * @swagger
 * /admin/category/create:
 *   post:
 *     summary: Tạo danh mục
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: "Rau củ"
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Tên danh mục mới."
 *     responses:
 *       200:
 *         description: Tạo category thành công
 *       400:
 *         description: Thiếu tên category
 *       409:
 *         description: Đã tồn tại category có tên này
 *       403:
 *         description: Truy cập bị từ chối
 *       500:
 *         description: Lỗi máy chủ
 */
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing category name",
          vn: "Thiếu tên category",
        },
        resultCode: "00131",
      });
    }

    // Check duplicate
    const { data: existing } = await supabase
     .from("foodcategory")
     .select("id")
     .eq("name", name.trim())
     .maybeSingle();

    if (existing) {
      return res.status(409).json({
        resultMessage: {
          en: "This category name already exists",
          vn: "Đã tồn tại category có tên này",
        },
        resultCode: "00132",
      });
    }

    // Insert
    const { data, error } = await supabase
     .from("foodcategory")
     .insert([{ name: name.trim() }])
     .select()
     .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Category created successfully",
        vn: "Tạo category thành công",
      },
      resultCode: "00135",
      category: data,
    });
  } catch (err) {
    console.error("Error creating category:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /admin/category/list:
 *   get:
 *     summary: Lấy tất cả danh mục
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     responses:
 *       200:
 *         description: Lấy các category thành công
 *       403:
 *         description: Truy cập bị từ chối
 *       500:
 *         description: Lỗi máy chủ
 */
export const getAllCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
     .from("foodcategory")
     .select("*")
     .order("name", { ascending: true });
    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Successfully retrieved categories",
        vn: "Lấy các category thành công",
      },
      resultCode: "00129",
      categories: data,
    });
  } catch (err) {
    console.error("Error fetching categories:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /admin/category/update:
 *   put:
 *     summary: Chỉnh sửa danh mục theo tên
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldName:
 *                 type: string
 *                 example: "Rau củ"
 *                 description: "Tên danh mục hiện tại."
 *               newName:
 *                 type: string
 *                 example: "Rau củ quả"
 *                 description: "Tên mới."
 *     responses:
 *       200:
 *         description: Sửa đổi category thành công
 *       400:
 *         description: Thiếu thông tin name cũ, name mới
 *       402:
 *         description: Tên cũ trùng với tên mới
 *       404:
 *         description: Không tìm thấy category với tên cung cấp
 *       409:
 *         description: Tên mới đã tồn tại
 *       403:
 *         description: Truy cập bị từ chối
 *       500:
 *         description: Lỗi máy chủ
 */
export const updateCategory = async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    if (!oldName ||!newName?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing information old name, new name",
          vn: "Thiếu thông tin name cũ, name mới",
        },
        resultCode: "00136",
      });
    }

    if (oldName === newName.trim()) {
        return res.status(400).json({
            resultMessage: {
                en: "Old name cannot be the same as new name",
                vn: "Tên cũ trùng với tên mới",
            },
            resultCode: "00137",
        });
    }

    const { data: category } = await supabase
     .from("foodcategory")
     .select("*")
     .eq("name", oldName)
     .maybeSingle();

    if (!category) {
      return res.status(404).json({
        resultMessage: {
          en: "Could not find category with the provided name",
          vn: "Không tìm thấy category với tên cung cấp",
        },
        resultCode: "00138",
      });
    }
    
    // Check if newName already exists (00138 X/00132)
    const { data: existingNewName } = await supabase
     .from("foodcategory")
     .select("id")
     .eq("name", newName.trim())
     .maybeSingle();

    if (existingNewName) {
        return res.status(409).json({
            resultMessage: {
                en: "New category name already exists",
                vn: "Tên mới đã tồn tại",
            },
            resultCode: "00138x",
        });
    }


    const { data, error } = await supabase
     .from("foodcategory")
     .update({ name: newName.trim() })
     .eq("id", category.id)
     .select()
     .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Successfully updated category",
        vn: "Sửa đổi category thành công",
      },
      resultCode: "00141",
      category: data,
    });
  } catch (err) {
    console.error("Error updating category:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /admin/category/delete:
 *   delete:
 *     summary: Xóa danh mục theo tên
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Rau củ quả"
 *                 description: "Tên danh mục cần xóa."
 *     responses:
 *       200:
 *         description: Xóa category thành công
 *       400:
 *         description: Thiếu thông tin tên của category
 *       404:
 *         description: Không tìm thấy category với tên cung cấp
 *       409:
 *         description: Vi phạm ràng buộc
 *       403:
 *         description: Truy cập bị từ chối
 *       500:
 *         description: Lỗi máy chủ
 */
export const deleteCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing category name information",
          vn: "Thiếu thông tin tên của category",
        },
        resultCode: "00142",
      });
    }

    const { data: category } = await supabase
     .from("foodcategory")
     .select("id")
     .eq("name", name)
     .maybeSingle();

    if (!category) {
      return res.status(404).json({
        resultMessage: {
          en: "Could not find category with the provided name",
          vn: "Không tìm thấy category với tên cung cấp",
        },
        resultCode: "00143",
      });
    }
    
    // Check FK Constraint (Food table)
    const { count, error: countError } = await supabase
     .from("food")
     .select("id", { count: 'exact' })
     .eq("id", category.id);

    if (countError) throw countError;

    if (count > 0) {
        return res.status(409).json({
            resultMessage: {
                en: "Cannot delete category due to existing food references",
                vn: "Không thể xóa Category vì còn thực phẩm tham chiếu",
            },
            resultCode: "00144",
        });
    }

    const { error } = await supabase
     .from("foodcategory")
     .delete()
     .eq("id", category.id);

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Category deleted successfully",
        vn: "Xóa category thành công",
      },
      resultCode: "00146",
    });
  } catch (err) {
    console.error("Error deleting category:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// UNIT SECTION

/**
 * @swagger
 * /admin/units/create:
 *   post:
 *     summary: Tạo đơn vị
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Kilogram"
 *                 description: "Tên đơn vị mới."
 *     responses:
 *       200:
 *         description: Tạo đơn vị thành công
 *       400:
 *         description: Thiếu thông tin tên của đơn vị
 *       409:
 *         description: Đã tồn tại đơn vị có tên này
 *       403:
 *         description: Truy cập bị từ chối
 *       500:
 *         description: Lỗi máy chủ
 */
export const createUnit = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing unit name information",
          vn: "Thiếu thông tin tên của đơn vị",
        },
        resultCode: "00112",
      });
    }

    const { data: existing } = await supabase
     .from("unitofmeasurement")
     .select("id")
     .eq("unitname", name.trim())
     .maybeSingle();

    if (existing) {
      return res.status(409).json({
        resultMessage: {
          en: "Unit with this name already exists",
          vn: "Đã tồn tại đơn vị có tên này",
        },
        resultCode: "00113",
      });
    }

    const { data, error } = await supabase
     .from("unitofmeasurement")
     .insert([{ unitname: name.trim() }])
     .select()
     .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Unit created successfully",
        vn: "Tạo đơn vị thành công",
      },
      resultCode: "00116",
      unit: data,
    });
  } catch (err) {
    console.error("Error creating unit:", err.message);
    res.status(500).json({ error: "Internal server error", resultCode: "00115" });
  }
};

/**
 * @swagger
 * /admin/units/list:
 *   get:
 *     summary: Lấy tất cả các đơn vị
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     responses:
 *       200:
 *         description: Lấy các unit thành công
 *       403:
 *         description: Truy cập bị từ chối
 *       500:
 *         description: Lỗi máy chủ
 */
export const getAllUnits = async (req, res) => {
  try {
    const { data, error } = await supabase
     .from("unitofmeasurement")
     .select("*")
     .order("unitname", { ascending: true });
    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Successfully retrieved units",
        vn: "Lấy các unit thành công",
      },
      resultCode: "00110",
      units: data,
    });
  } catch (err) {
    console.error("Error fetching units:", err.message);
    res.status(500).json({ error: "Internal server error", resultCode: "00114" });
  }
};

/**
 * @swagger
 * /admin/units/update:
 *   put:
 *     summary: Chỉnh sửa đơn vị theo tên
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldName:
 *                 type: string
 *                 example: "Kilogram"
 *                 description: "Tên đơn vị hiện tại."
 *               newName:
 *                 type: string
 *                 example: "Kg"
 *                 description: "Tên mới."
 *     responses:
 *       200:
 *         description: Sửa đổi đơn vị thành công 
 *       400:
 *         description: Thiếu thông tin name cũ, name mới
 *       402:
 *         description: Tên cũ trùng với tên mới
 *       404:
 *         description: Không tìm thấy đơn vị với tên cung cấp
 *       409:
 *         description: Tên mới đã tồn tại
 *       403:
 *         description: Truy cập bị từ chối
 *       500:
 *         description: Lỗi máy chủ
 */
export const updateUnit = async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    if (!oldName ||!newName?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing information old name, new name",
          vn: "Thiếu thông tin name cũ, name mới",
        },
        resultCode: "00117",
      });
    }

    if (oldName === newName.trim()) {
        return res.status(400).json({
            resultMessage: {
                en: "Old name cannot be the same as new name",
                vn: "Tên cũ trùng với tên mới",
            },
            resultCode: "00118",
        });
    }

    const { data: unit } = await supabase
     .from("unitofmeasurement")
     .select("*")
     .eq("unitname", oldName)
     .maybeSingle();

    if (!unit) {
      return res.status(404).json({
        resultMessage: {
          en: "Could not find unit with the provided name",
          vn: "Không tìm thấy đơn vị với tên cung cấp",
        },
        resultCode: "00119",
      });
    }

    // Check if newName already exists
    const { data: existingNewName } = await supabase
     .from("unitofmeasurement")
     .select("id")
     .eq("unitname", newName.trim())
     .maybeSingle();

    if (existingNewName) {
        return res.status(409).json({
            resultMessage: {
                en: "New unit name already exists",
                vn: "Tên mới đã tồn tại",
            },
            resultCode: "00119x",
        });
    }

    const { data, error } = await supabase
     .from("unitofmeasurement")
     .update({ unitname: newName.trim() })
     .eq("id", unit.id)
     .select()
     .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Unit updated successfully",
        vn: "Sửa đổi đơn vị thành công",
      },
      resultCode: "00122",
      unit: data,
    });
  } catch (err) {
    console.error("Error updating unit:", err.message);
    res.status(500).json({ error: "Internal server error", resultCode: "00120" });
  }
};

/**
 * @swagger
 * /admin/units/delete:
 *   delete:
 *     summary: Xóa đơn vị theo tên
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Kg"
 *                 description: "Tên đơn vị cần xóa."
 *     responses:
 *       200:
 *         description: Xóa đơn vị thành công
 *       400:
 *         description: Thiếu thông tin tên của đơn vị
 *       404:
 *         description: Không tìm thấy đơn vị với tên cung cấp
 *       409:
 *         description: Vi phạm ràng buộc
 *       403:
 *         description: Truy cập bị từ chối
 *       500:
 *         description: Lỗi máy chủ
 */
export const deleteUnit = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing unit name information",
          vn: "Thiếu thông tin tên của đơn vị",
        },
        resultCode: "00123",
      });
    }

    const { data: unit } = await supabase
     .from("unitofmeasurement")
     .select("id")
     .eq("unitname", name)
     .maybeSingle();

    if (!unit) {
      return res.status(404).json({
        resultMessage: {
          en: "Could not find unit with the provided name",
          vn: "Không tìm thấy đơn vị với tên cung cấp",
        },
        resultCode: "00125",
      });
    }
    
    // Check FK Constraint (Food table)
    const { count, error: countError } = await supabase
     .from("food")
     .select("id", { count: 'exact' })
     .eq("id", unit.id);

    if (countError) throw countError;

    if (count > 0) {
        return res.status(409).json({
            resultMessage: {
                en: "Cannot delete unit due to existing food references",
                vn: "Không thể xóa đơn vị vì còn thực phẩm tham chiếu",
            },
            resultCode: "00126",
        });
    }

    const { error } = await supabase.from("unitofmeasurement").delete().eq("id", unit.id);
    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Unit deleted successfully",
        vn: "Xóa đơn vị thành công",
      },
      resultCode: "00128",
    });
  } catch (err) {
    console.error("Error deleting unit:", err.message);
    res.status(500).json({ error: "Internal server error", resultCode: "00126" });
  }
};
