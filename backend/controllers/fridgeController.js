// controllers/fridgeController.js
import { supabase } from "../db.js";

// Helper: cộng thêm số ngày vào ngày hiện tại → ISO string
const addDaysISO = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

/**
 * CREATE FRIDGE ITEM
 * POST /fridge
 * Body: { foodName, quantity, useWithinDays, note?, groupId? }
 */
export const createFridgeItem = async (req, res) => {
  try {
    const { foodName, quantity, useWithinDays, note, groupId } = req.body;
    const user = req.user;

    if (!foodName || !quantity || !useWithinDays) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing required fields (foodName, quantity, useWithinDays)",
          vn: "Thiếu thông tin bắt buộc (tên thực phẩm, số lượng, hạn sử dụng)",
        },
        resultCode: "400",
      });
    }

    const group_id = groupId || user?.groupId;
    if (!group_id) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing groupId",
          vn: "Thiếu groupId",
        },
        resultCode: "400",
      });
    }

    const qty = parseFloat(quantity);
    const days = parseInt(useWithinDays, 10);
    if (isNaN(qty) || qty <= 0 || isNaN(days) || days <= 0) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid quantity or days",
          vn: "Số lượng hoặc số ngày không hợp lệ",
        },
        resultCode: "400",
      });
    }

    // Kiểm tra thực phẩm tồn tại
    const { data: food } = await supabase
      .from("foods")
      .select("id")
      .eq("name", foodName)
      .eq("group_id", group_id)
      .maybeSingle();

    if (!food) {
      return res.status(404).json({
        resultMessage: {
          en: "Food not found in this group",
          vn: "Không tìm thấy thực phẩm trong nhóm này",
        },
        resultCode: "00208",
      });
    }

    // Kiểm tra đã có trong tủ chưa
    const { data: existing } = await supabase
      .from("fridge_items")
      .select("id")
      .eq("food_id", food.id)
      .eq("group_id", group_id)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        resultMessage: {
          en: "Fridge item already exists",
          vn: "Thực phẩm này đã có trong tủ lạnh",
        },
        resultCode: "00199",
      });
    }

    const expirationDate = addDaysISO(days);

    const { data, error } = await supabase
      .from("fridge_items")
      .insert([
        {
          food_id: food.id,
          group_id,
          quantity: qty,
          use_within_days: days,
          expiration_date: expirationDate,
          note: note || null,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Fridge item added successfully",
        vn: "Thêm thực phẩm vào tủ lạnh thành công",
      },
      resultCode: "00202",
      newItem: data,
    });
  } catch (err) {
    console.error("Error creating fridge item:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * UPDATE FRIDGE ITEM
 * PUT /fridge
 * Body: { id, newQuantity?, newUseWithinDays?, note? }
 */
export const updateFridgeItem = async (req, res) => {
  try {
    const { id, newQuantity, newUseWithinDays, note } = req.body;

    if (!id) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing item id",
          vn: "Thiếu id của mục tủ lạnh",
        },
        resultCode: "400",
      });
    }

    const { data: item } = await supabase
      .from("fridge_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!item) {
      return res.status(404).json({
        resultMessage: {
          en: "Fridge item not found",
          vn: "Không tìm thấy mục tủ lạnh",
        },
        resultCode: "404",
      });
    }

    const updates = { updated_at: new Date().toISOString() };

    if (newQuantity !== undefined) {
      const q = parseFloat(newQuantity);
      if (isNaN(q) || q <= 0) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid quantity",
            vn: "Số lượng không hợp lệ",
          },
          resultCode: "400",
        });
      }
      updates.quantity = q;
    }

    if (newUseWithinDays !== undefined) {
      const d = parseInt(newUseWithinDays, 10);
      if (isNaN(d) || d <= 0) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid days value",
            vn: "Số ngày không hợp lệ",
          },
          resultCode: "400",
        });
      }
      updates.use_within_days = d;
      updates.expiration_date = addDaysISO(d);
    }

    if (note !== undefined) updates.note = note;

    if (Object.keys(updates).length === 1) {
      return res.status(400).json({
        resultMessage: {
          en: "No updates provided",
          vn: "Không có dữ liệu cần cập nhật",
        },
        resultCode: "400",
      });
    }

    const { data, error } = await supabase
      .from("fridge_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Fridge item updated successfully",
        vn: "Cập nhật thực phẩm trong tủ lạnh thành công",
      },
      resultCode: "00216",
      updatedItem: data,
    });
  } catch (err) {
    console.error("Error updating fridge item:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * DELETE FRIDGE ITEM
 * DELETE /fridge
 * Body: { id }
 */
export const deleteFridgeItem = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing item id",
          vn: "Thiếu id của mục tủ lạnh",
        },
        resultCode: "400",
      });
    }

    const { data: existing } = await supabase
      .from("fridge_items")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({
        resultMessage: {
          en: "Fridge item not found",
          vn: "Không tìm thấy mục tủ lạnh",
        },
        resultCode: "404",
      });
    }

    const { error } = await supabase.from("fridge_items").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Fridge item deleted successfully",
        vn: "Xóa thực phẩm khỏi tủ lạnh thành công",
      },
      resultCode: "00224",
    });
  } catch (err) {
    console.error("Error deleting fridge item:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET ALL FRIDGE ITEMS (by group)
 * GET /fridge?groupId=...
 */
export const getFridgeItems = async (req, res) => {
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
      .from("fridge_items")
      .select(
        `
        id, quantity, expiration_date, use_within_days, note, created_at, updated_at,
        foods (id, name, image_url),
        groups (id, name)
      `
      )
      .eq("group_id", groupId)
      .order("expiration_date", { ascending: true });

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Get fridge items successfully",
        vn: "Lấy danh sách thực phẩm trong tủ lạnh thành công",
      },
      resultCode: "00228",
      items: data,
    });
  } catch (err) {
    console.error("Error fetching fridge items:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET FRIDGE ITEM BY ID
 * GET /fridge/:id
 */
export const getFridgeItemById = async (req, res) => {
  try {
    const id = req.params.id;

    const { data, error } = await supabase
      .from("fridge_items")
      .select(
        `
        *, 
        foods (id, name, image_url),
        groups (id, name)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        resultMessage: {
          en: "Fridge item not found",
          vn: "Không tìm thấy mục tủ lạnh",
        },
        resultCode: "404",
      });
    }

    res.status(200).json({
      resultMessage: {
        en: "Get fridge item detail successfully",
        vn: "Lấy chi tiết thực phẩm trong tủ lạnh thành công",
      },
      resultCode: "00228",
      item: data,
    });
  } catch (err) {
    console.error("Error fetching fridge item by id:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
