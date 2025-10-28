// controllers/adminController.js
import { supabase } from "../db.js";

// CATEGORY SECTION

/** Create new category */
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

/** Get all categories */
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

/** Update category name */
export const updateCategory = async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    if (!oldName || !newName?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing oldName or newName",
          vn: "Thiếu tên cũ hoặc tên mới",
        },
        resultCode: "400",
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

/** Delete category */
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
        resultCode: "00138",
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

export const createUnit = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing unit name",
          vn: "Thiếu tên đơn vị",
        },
        resultCode: "400",
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
    res.status(500).json({ error: "Internal server error" });
  }
};

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
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUnit = async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    if (!oldName || !newName?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing oldName or newName",
          vn: "Thiếu tên cũ hoặc tên mới",
        },
        resultCode: "400",
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
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUnit = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing unit name",
          vn: "Thiếu tên đơn vị",
        },
        resultCode: "400",
      });
    }

    const { data: unit } = await supabase
      .from("units")
      .select("*")
      .eq("unit_name", name)
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
    res.status(500).json({ error: "Internal server error" });
  }
};
