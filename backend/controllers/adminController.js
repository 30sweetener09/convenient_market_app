// controllers/adminController.js
import { supabase } from "../db.js";

// CATEGORY SECTION

/**
 * @swagger
 * /admin/category:
 *   post:
 *     summary: Tạo danh mục (Category) mới
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Tên danh mục mới."
 *     responses:
 *       200:
 *         description: Tạo category thành công (00135)
 *       400:
 *         description: Thiếu tên (400)
 *       409:
 *         description: Category đã tồn tại (00132)
 *       403:
 *         description: Truy cập bị từ chối (Cần System Admin)
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
        resultCode: "400",
      });
    }

    const { data: existing } = await supabase
     .from("categories")
     .select("id")
     .eq("name", name.trim())
     .maybeSingle();

    if (existing) {
      return res.status(409).json({
        resultMessage: {
          en: "Category already exists",
          vn: "Category đã tồn tại",
        },
        resultCode: "00132",
      });
    }

    const { data, error } = await supabase
     .from("categories")
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
 * /admin/category:
 *   get:
 *     summary: Lấy tất cả danh mục (Category)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     responses:
 *       200:
 *         description: Lấy danh sách category thành công (00129)
 *       403:
 *         description: Truy cập bị từ chối (Cần System Admin)
 *       500:
 *         description: Lỗi máy chủ
 */
export const getAllCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
     .from("categories")
     .select("*")
     .order("name", { ascending: true });
    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Get category list successful",
        vn: "Lấy danh sách category thành công",
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
 * /admin/category:
 *   put:
 *     summary: Cập nhật tên danh mục (Category)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               oldName:
 *                 type: string
 *                 description: "Tên danh mục hiện tại (00138)."
 *               newName:
 *                 type: string
 *                 description: "Tên mới (00137)."
 *     responses:
 *       200:
 *         description: Cập nhật category thành công (00141)
 *       400:
 *         description: Thiếu tên (400) hoặc Tên cũ trùng tên mới (00137)
 *       404:
 *         description: Category cũ không tìm thấy (00138)
 *       409:
 *         description: Tên mới đã tồn tại (00132)
 *       403:
 *         description: Truy cập bị từ chối (Cần System Admin)
 *       500:
 *         description: Lỗi máy chủ
 */
export const updateCategory = async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    if (!oldName ||!newName?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing oldName or newName",
          vn: "Thiếu tên cũ hoặc tên mới",
        },
        resultCode: "400",
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
     .from("categories")
     .select("*")
     .eq("name", oldName)
     .maybeSingle();

    if (!category) {
      return res.status(404).json({
        resultMessage: {
          en: "Category not found",
          vn: "Không tìm thấy category",
        },
        resultCode: "00138",
      });
    }
    
    // Check if newName already exists (00138 X/00132)
    const { data: existingNewName } = await supabase
     .from("categories")
     .select("id")
     .eq("name", newName.trim())
     .maybeSingle();

    if (existingNewName) {
        return res.status(409).json({
            resultMessage: {
                en: "New category name already exists",
                vn: "Tên mới đã tồn tại",
            },
            resultCode: "00132",
        });
    }


    const { data, error } = await supabase
     .from("categories")
     .update({ name: newName.trim() })
     .eq("id", category.id)
     .select()
     .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Category updated successfully",
        vn: "Cập nhật category thành công",
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
 * /admin/category:
 *   delete:
 *     summary: Xóa danh mục (Category)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Tên danh mục cần xóa (00143)."
 *     responses:
 *       200:
 *         description: Xóa category thành công (00146)
 *       400:
 *         description: Thiếu tên (400)
 *       404:
 *         description: Category không tìm thấy (00143)
 *       409:
 *         description: Vi phạm ràng buộc (Vẫn còn Food tham chiếu) (Sử dụng 00144 hoặc mã tùy chỉnh)
 *       403:
 *         description: Truy cập bị từ chối (Cần System Admin)
 *       500:
 *         description: Lỗi máy chủ
 */
export const deleteCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing category name",
          vn: "Thiếu tên category",
        },
        resultCode: "400",
      });
    }

    const { data: category } = await supabase
     .from("categories")
     .select("id")
     .eq("name", name)
     .maybeSingle();

    if (!category) {
      return res.status(404).json({
        resultMessage: {
          en: "Category not found",
          vn: "Không tìm thấy category",
        },
        resultCode: "00143",
      });
    }
    
    // Check FK Constraint (Food table)
    const { count, error: countError } = await supabase
     .from("foods")
     .select("id", { count: 'exact' })
     .eq("category_id", category.id);

    if (countError) throw countError;

    if (count > 0) {
        return res.status(409).json({
            resultMessage: {
                en: "Cannot delete category due to existing food references",
                vn: "Không thể xóa Category vì còn thực phẩm tham chiếu",
            },
            resultCode: "00144", // Using 00144 for server/conflict error
        });
    }

    const { error } = await supabase
     .from("categories")
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
 * /admin/unit:
 *   post:
 *     summary: Tạo đơn vị đo lường (Unit) mới
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Tên đơn vị mới (unitName)."
 *     responses:
 *       200:
 *         description: Tạo đơn vị thành công (00116)
 *       400:
 *         description: Thiếu tên đơn vị (00112)
 *       409:
 *         description: Đơn vị đã tồn tại (00113)
 *       403:
 *         description: Truy cập bị từ chối (Cần System Admin)
 *       500:
 *         description: Lỗi máy chủ (00115)
 */
export const createUnit = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing unit name",
          vn: "Thiếu tên đơn vị",
        },
        resultCode: "00112",
      });
    }

    const { data: existing } = await supabase
     .from("units")
     .select("id")
     .eq("unit_name", name.trim())
     .maybeSingle();

    if (existing) {
      return res.status(409).json({
        resultMessage: {
          en: "Unit already exists",
          vn: "Đơn vị đã tồn tại",
        },
        resultCode: "00113",
      });
    }

    const { data, error } = await supabase
     .from("units")
     .insert([{ unit_name: name.trim() }])
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
 * /admin/unit:
 *   get:
 *     summary: Lấy tất cả đơn vị đo lường (Unit)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn vị thành công (00110)
 *       403:
 *         description: Truy cập bị từ chối (Cần System Admin)
 *       500:
 *         description: Lỗi máy chủ (00114)
 */
export const getAllUnits = async (req, res) => {
  try {
    const { data, error } = await supabase
     .from("units")
     .select("*")
     .order("unit_name", { ascending: true });
    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Get unit list successful",
        vn: "Lấy danh sách đơn vị thành công",
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
 * /admin/unit:
 *   put:
 *     summary: Cập nhật tên đơn vị đo lường (Unit)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               oldName:
 *                 type: string
 *                 description: "Tên đơn vị hiện tại (unitName)."
 *               newName:
 *                 type: string
 *                 description: "Tên mới (00118)."
 *     responses:
 *       200:
 *         description: Cập nhật đơn vị thành công (00122)
 *       400:
 *         description: Thiếu tên (00117) hoặc Tên cũ trùng tên mới (00118)
 *       404:
 *         description: Đơn vị cũ không tìm thấy (00119)
 *       409:
 *         description: Tên mới đã tồn tại (00113)
 *       403:
 *         description: Truy cập bị từ chối (Cần System Admin)
 *       500:
 *         description: Lỗi máy chủ (00120)
 */
export const updateUnit = async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    if (!oldName ||!newName?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing oldName or newName",
          vn: "Thiếu tên cũ hoặc tên mới",
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
     .from("units")
     .select("*")
     .eq("unit_name", oldName)
     .maybeSingle();

    if (!unit) {
      return res.status(404).json({
        resultMessage: {
          en: "Unit not found",
          vn: "Không tìm thấy đơn vị",
        },
        resultCode: "00119",
      });
    }

    // Check if newName already exists (00113)
    const { data: existingNewName } = await supabase
     .from("units")
     .select("id")
     .eq("unit_name", newName.trim())
     .maybeSingle();

    if (existingNewName) {
        return res.status(409).json({
            resultMessage: {
                en: "New unit name already exists",
                vn: "Đơn vị đã tồn tại",
            },
            resultCode: "00113",
        });
    }

    const { data, error } = await supabase
     .from("units")
     .update({ unit_name: newName.trim() })
     .eq("id", unit.id)
     .select()
     .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Unit updated successfully",
        vn: "Cập nhật đơn vị thành công",
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
 * /admin/unit:
 *   delete:
 *     summary: Xóa đơn vị đo lường (Unit)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Tên đơn vị cần xóa (unitName)."
 *     responses:
 *       200:
 *         description: Xóa đơn vị thành công (00128)
 *       400:
 *         description: Thiếu tên đơn vị (00123)
 *       404:
 *         description: Đơn vị không tìm thấy (00125)
 *       409:
 *         description: Vi phạm ràng buộc (Vẫn còn Food tham chiếu) (00126)
 *       403:
 *         description: Truy cập bị từ chối (Cần System Admin)
 *       500:
 *         description: Lỗi máy chủ (00126)
 */
export const deleteUnit = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing unit name",
          vn: "Thiếu tên đơn vị",
        },
        resultCode: "00123",
      });
    }

    const { data: unit } = await supabase
     .from("units")
     .select("id")
     .eq("unit_name", name)
     .maybeSingle();

    if (!unit) {
      return res.status(404).json({
        resultMessage: {
          en: "Unit not found",
          vn: "Không tìm thấy đơn vị",
        },
        resultCode: "00125",
      });
    }
    
    // Check FK Constraint (Food table)
    const { count, error: countError } = await supabase
     .from("foods")
     .select("id", { count: 'exact' })
     .eq("unit_id", unit.id);

    if (countError) throw countError;

    if (count > 0) {
        return res.status(409).json({
            resultMessage: {
                en: "Cannot delete unit due to existing food references",
                vn: "Không thể xóa Đơn vị vì còn thực phẩm tham chiếu",
            },
            resultCode: "00126",
        });
    }

    const { error } = await supabase.from("units").delete().eq("id", unit.id);
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
