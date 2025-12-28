import { supabase } from "../db.js";

// ==========================================
// CATEGORY SECTION
// ==========================================

/**
 * @swagger
 * /admin/category/create:
 *   post:
 *     summary: Tạo danh mục
 *     description: Tạo danh mục mới trong hệ thống
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: "Tên danh mục mới"
 *                 example: "Rau củ"
 *     responses:
 *       200:
 *         description: Tạo category thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Category created successfully"
 *                     vn:
 *                       type: string
 *                       example: "Tạo category thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00135"
 *                 category:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 15
 *                     name:
 *                       type: string
 *                       example: "Rau củ"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Thiếu tên category
 *       409:
 *         description: Đã tồn tại category có tên này
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

    // SỬA: Dùng ilike để check trùng tên không phân biệt hoa thường
    const { data: existing } = await supabase
      .from("foodcategory")
      .select("id")
      .ilike("name", name.trim())
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
    res.status(500).json({ error: "Internal server error", resultCode: "00133" });
  }
};

/**
 * @swagger
 * /admin/category/list:
 *   get:
 *     summary: Lấy tất cả danh mục
 *     description: Lấy danh sách tất cả các danh mục thực phẩm
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy các category thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Successfully retrieved categories"
 *                     vn:
 *                       type: string
 *                       example: "Lấy các category thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00129"
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Thịt"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
    res.status(500).json({ error: "Internal server error", resultCode: "00134" });
  }
};

/**
 * @swagger
 * /admin/category/update:
 *   put:
 *     summary: Chỉnh sửa danh mục theo tên
 *     description: Sửa đổi danh mục hiện có thông qua tên cũ và tên mới
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldName
 *               - newName
 *             properties:
 *               oldName:
 *                 type: string
 *                 description: Tên danh mục hiện tại
 *                 example: "Rau củ"
 *               newName:
 *                 type: string
 *                 description: Tên danh mục mới
 *                 example: "Rau củ quả"
 *     responses:
 *       200:
 *         description: Sửa đổi category thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     vn:
 *                       type: string
 *                       example: "Sửa đổi category thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00141"
 *                 category:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                       example: "Rau củ quả"
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

    if (!oldName || !newName?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing information old name, new name",
          vn: "Thiếu thông tin name cũ, name mới",
        },
        resultCode: "00136",
      });
    }

    // Chặn nếu tên y hệt nhau (kể cả case)
    if (oldName === newName.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Old name cannot be the same as new name",
          vn: "Tên cũ trùng với tên mới",
        },
        resultCode: "00137",
      });
    }

    // 1. Tìm Category cũ (dùng ilike)
    const { data: category } = await supabase
      .from("foodcategory")
      .select("*")
      .ilike("name", oldName.trim())
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

    // 2. Check trùng tên mới (Loại trừ chính nó - neq id)
    const { data: existingNewName } = await supabase
      .from("foodcategory")
      .select("id")
      .ilike("name", newName.trim())
      .neq("id", category.id) // Quan trọng: bỏ qua chính nó
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

    // 3. Update
    const { data, error } = await supabase
      .from("foodcategory")
      .update({ name: newName.trim() }) // Cập nhật tên mới (bao gồm case mới)
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
    res.status(500).json({ error: "Internal server error", resultCode: "00139" });
  }
};

/**
 * @swagger
 * /admin/category/delete:
 *   delete:
 *     summary: Xóa danh mục theo tên
 *     description: Xóa danh mục theo tên
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên danh mục cần xóa
 *                 example: "Rau củ quả"
 *     responses:
 *       200:
 *         description: Xóa category thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00146"
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

    // 1. Tìm Category (dùng ilike)
    const { data: category } = await supabase
      .from("foodcategory")
      .select("id")
      .ilike("name", name.trim())
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

    // 2. Check FK Constraint (Food table)
    // Lưu ý: Cột FK trong bảng Food là FoodCategoryId (hoặc category_id tùy DB)
    const { count, error: countError } = await supabase
      .from("food") // Hoặc "Food"
      .select("id", { count: 'exact' })
      .eq("foodcategoryid", category.id); // Đảm bảo đúng tên cột FK

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

    // 3. Delete
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
    res.status(500).json({ error: "Internal server error", resultCode: "00145" });
  }
};



// ==========================================
// UNIT SECTION
// ==========================================

/**
 * @swagger
 * /admin/units/create:
 *   post:
 *     summary: Tạo đơn vị
 *     description: Tạo đơn vị mới
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên đơn vị mới
 *                 example: "Kg"
 *     responses:
 *       200:
 *         description: Tạo đơn vị thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00116"
 *                 unit:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     unitName:
 *                       type: string
 *                       example: "Kg"
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

    // Check trùng tên (Case-insensitive)
    const { data: existing } = await supabase
      .from("unitofmeasurement")
      .select("id")
      .ilike("unitname", name.trim()) 
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
 *     description: Lấy danh sách các đơn vị đo lường
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy các unit thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00110"
 *                 units:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       unitName:
 *                         type: string
 *                         example: "Kg"
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
 *     description: Chỉnh sửa đơn vị theo tên cũ và tên mới
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldName
 *               - newName
 *             properties:
 *               oldName:
 *                 type: string
 *                 description: Tên đơn vị hiện tại
 *                 example: "Kg"
 *               newName:
 *                 type: string
 *                 description: Tên đơn vị mới
 *                 example: "Kilogram"
 *     responses:
 *       200:
 *         description: Sửa đổi đơn vị thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00122"
 *                 unit:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     unitName:
 *                       type: string
 *                       example: "Kilogram"
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

    if (!oldName || !newName?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing information old name, new name",
          vn: "Thiếu thông tin name cũ, name mới",
        },
        resultCode: "00117",
      });
    }

    // Nếu tên y hệt nhau (kể cả hoa thường) thì báo lỗi không có gì thay đổi
    // Tuy nhiên nếu user muốn đổi "kg" -> "Kg" (khác nhau về case) thì vẫn cho qua bước này
    if (oldName === newName.trim()) {
        return res.status(400).json({
            resultMessage: {
                en: "Old name cannot be the same as new name",
                vn: "Tên cũ trùng với tên mới",
            },
            resultCode: "00118",
        });
    }

    // 1. Tìm đơn vị cũ (Dùng ilike để tìm được chính xác)
    const { data: currentUnit } = await supabase
      .from("unitofmeasurement")
      .select("*")
      .ilike("unitname", oldName.trim()) 
      .maybeSingle();

    if (!currentUnit) {
      return res.status(404).json({
        resultMessage: {
          en: "Could not find unit with the provided name",
          vn: "Không tìm thấy đơn vị với tên cung cấp",
        },
        resultCode: "00119",
      });
    }

    // 2. Check trùng tên mới (Trừ chính nó ra)
    const { data: existingNewName } = await supabase
      .from("unitofmeasurement")
      .select("id")
      .ilike("unitname", newName.trim())
      .neq("id", currentUnit.id) // Quan trọng: Loại trừ chính ID đang sửa
      .maybeSingle();

    if (existingNewName) {
        return res.status(409).json({
            resultMessage: {
                en: "New unit name already exists",
                vn: "Tên mới đã tồn tại",
            },
            resultCode: "00120",
        });
    }

    // 3. Update
    const { data, error } = await supabase
      .from("unitofmeasurement")
      .update({ unitname: newName.trim() })
      .eq("id", currentUnit.id)
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
    res.status(500).json({ error: "Internal server error", resultCode: "00121" });
  }
};


/**
 * @swagger
 * /admin/units/delete:
 *   delete:
 *     summary: Xóa đơn vị theo tên
 *     description: Xóa đơn vị theo tên
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên đơn vị cần xóa
 *                 example: "Kilogram"
 *     responses:
 *       200:
 *         description: Xóa đơn vị thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00128"
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

    // 1. Tìm Unit cần xóa (ilike)
    const { data: unit } = await supabase
      .from("unitofmeasurement")
      .select("id")
      .ilike("unitname", name.trim())
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
    
    // 2. Check FK Constraint (Food table)
    // Lưu ý: Cột FK trong bảng Food phải đúng tên (UnitOfMeasurementId hoặc unit_id tùy DB thực tế)
    const { count, error: countError } = await supabase
      .from("food") // Hoặc "Food"
      .select("id", { count: 'exact' })
      .eq("unitofmeasurementid", unit.id);

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

    // 3. Delete
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
    res.status(500).json({ error: "Internal server error", resultCode: "00127" });
  }
};
