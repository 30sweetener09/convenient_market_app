// controllers/fridgeController.js
import { supabase } from "../db.js";

// Helper: cộng thêm số ngày vào ngày hiện tại → ISO string
const addDaysISO = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

/**
 * @swagger
 * /fridge:
 *   post:
 *     summary: Thêm mục mới vào tủ lạnh (Fridge Item)
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               foodName: { type: string, description: "Tên thực phẩm Master Data (00194)." }
 *               quantity: { type: string, description: "Số lượng (00192)." }
 *               useWithinDays: { type: string, description: "Số ngày nên dùng trong (00191)." }
 *               note: { type: string, description: "Ghi chú (optional)." }
 *               groupId: { type: string, description: "GroupID nếu không dùng user context (optional)." }
 *     responses:
 *       200:
 *         description: Mục trong tủ lạnh được tạo thành công (00202)
 *       400:
 *         description: Thiếu trường bắt buộc (400), Quantity/Days không hợp lệ (400)
 *       403:
 *         description: Thiếu Group ID (400) hoặc Food không thuộc nhóm (00198)
 *       404:
 *         description: Food Master Data không tồn tại (00208)
 *       409:
 *         description: Mục đã tồn tại (00199)
 *       500:
 *         description: Lỗi máy chủ (00197)
 */
export const createFridgeItem = async (req, res) => {
  try {
    const { foodName, quantity, useWithinDays, note, groupId } = req.body;
    const user = req.user;

    if (!foodName ||!quantity ||!useWithinDays) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing required fields (foodName, quantity, useWithinDays)",
          vn: "Thiếu thông tin bắt buộc (tên thực phẩm, số lượng, hạn sử dụng)",
        },
        resultCode: "00203", // Vui cung cấp tất cả các trường cần thiết
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
        resultCode: "400", // (Lưu ý: API có 00191/00192, dùng 400 chung cho validation)
      });
    }

    // Kiểm tra thực phẩm tồn tại (00208) và thuộc nhóm (00198)
    const { data: food } = await supabase
     .from("foods")
     .select("id, group_id")
     .eq("name", foodName)
     .maybeSingle();

    if (!food) {
      return res.status(404).json({
        resultMessage: {
          en: "Food not found in master data",
          vn: "Không tìm thấy thực phẩm Master Data",
        },
        resultCode: "00208", 
      });
    }
    if (food.group_id!== group_id) {
        return res.status(403).json({
            resultMessage: {
                en: "Food does not belong to the user's group",
                vn: "Thực phẩm không thuộc quyền quản trị của nhóm.",
            },
            resultCode: "00198",
        });
    }

    // Kiểm tra đã có trong tủ chưa (00199)
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
     .insert()
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
    res.status(500).json({ error: "Internal server error", resultCode: "00197" });
  }
};

/**
 * @swagger
 * /fridge:
 *   put:
 *     summary: Cập nhật mục tủ lạnh (Fridge Item)
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: string, description: "ID mục tủ lạnh (itemId) (00204)." }
 *               newQuantity: { type: string, description: "Số lượng mới (optional)." }
 *               newUseWithinDays: { type: string, description: "Số ngày nên dùng mới (optional)." }
 *               note: { type: string, description: "Ghi chú mới (optional)." }
 *     responses:
 *       200:
 *         description: Cập nhật mục tủ lạnh thành công (00216)
 *       400:
 *         description: Thiếu ID (00204), Thiếu trường cập nhật (00204 X), Quantity/Days không hợp lệ (400)
 *       403:
 *         description: Không có quyền (00212)
 *       404:
 *         description: Item không tìm thấy (404)
 *       500:
 *         description: Lỗi máy chủ
 */
export const updateFridgeItem = async (req, res) => {
  try {
    const { id, newQuantity, newUseWithinDays, note } = req.body;
    const user = req.user;

    if (!id) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing item id",
          vn: "Thiếu id của mục tủ lạnh",
        },
        resultCode: "00204",
      });
    }

    const { data: item } = await supabase
     .from("fridge_items")
     .select("*")
     .eq("id", id)
     .eq("group_id", user?.groupId) // Ensure it belongs to the user's group
     .maybeSingle();

    if (!item) {
      return res.status(404).json({
        resultMessage: {
          en: "Fridge item not found",
          vn: "Không tìm thấy mục tủ lạnh",
        },
        resultCode: "00213", // Mục tủ lạnh không tồn tại.
      });
    }
    
    // Authorization Check (00212) - Assuming Middleware handles this

    const updates = { updated_at: new Date().toISOString() };

    // Check if any update field is provided (excluding initial updated_at)
    if (newQuantity === undefined && newUseWithinDays === undefined && note === undefined) {
        return res.status(400).json({
            resultMessage: {
                en: "No fields provided to update",
                vn: "Vui lòng cung cấp ít nhất một trường cần cập nhật",
            },
            resultCode: "00204 X", // Vui lòng cung cấp ít nhất một trong các trường sau
        });
    }

    if (newQuantity!== undefined) {
      const q = parseFloat(newQuantity);
      if (isNaN(q) || q <= 0) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid quantity",
            vn: "Số lượng không hợp lệ",
          },
          resultCode: "00206", // Vui lòng cung cấp một lượng hợp lệ!
        });
      }
      updates.quantity = q;
    }

    if (newUseWithinDays!== undefined) {
      const d = parseInt(newUseWithinDays, 10);
      if (isNaN(d) || d <= 0) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid days value",
            vn: "Số ngày không hợp lệ",
          },
          resultCode: "00205", // Vui lòng cung cấp một giá trị 'sử dụng trong' hợp lệ!
        });
      }
      updates.use_within_days = d;
      updates.expiration_date = addDaysISO(d);
    }

    if (note!== undefined) updates.note = note;

    // If no real updates were made (only updated_at), although we checked this before, safer to re-check
    if (Object.keys(updates).length === 1 && updates.updated_at) { 
        return res.status(400).json({
            resultMessage: {
                en: "No fields provided to update",
                vn: "Không có dữ liệu cần cập nhật",
            },
            resultCode: "00204 X", 
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
 * @swagger
 * /fridge:
 *   delete:
 *     summary: Xóa mục tủ lạnh (Fridge Item)
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: string, description: "ID mục tủ lạnh cần xóa." }
 *     responses:
 *       200:
 *         description: Xóa mục trong tủ lạnh thành công (00224)
 *       400:
 *         description: Thiếu ID (400)
 *       403:
 *         description: Không có quyền (00212)
 *       404:
 *         description: Item không tìm thấy (404)
 *       500:
 *         description: Lỗi máy chủ
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
     .eq("group_id", req.user?.groupId) // Ensure it belongs to the user's group
     .maybeSingle();

    if (!existing) {
      return res.status(404).json({
        resultMessage: {
          en: "Fridge item not found",
          vn: "Không tìm thấy mục tủ lạnh",
        },
        resultCode: "00213", // Dùng mã 00213 (Mục tủ lạnh không tồn tại)
      });
    }

    // Authorization Check (00212) - Assuming Middleware handles this

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
 * @swagger
 * /fridge:
 *   get:
 *     summary: Lấy tất cả mục tủ lạnh (Fridge Item) trong nhóm
 *     tags: [Fridge]
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
 *         description: Lấy danh sách thực phẩm trong tủ lạnh thành công (00228)
 *       400:
 *         description: Thiếu Group ID (400)
 *       403:
 *         description: Bạn chưa vào nhóm nào (00225)
 *       500:
 *         description: Lỗi máy chủ
 */
export const getFridgeItems = async (req, res) => {
  try {
    const user = req.user;
    const groupId = req.query.groupId || user?.groupId;

    if (!groupId) {
        // 00225: Bạn chưa vào nhóm nào
      return res.status(403).json({
        resultMessage: {
          en: "User does not belong to any group",
          vn: "Bạn chưa vào nhóm nào",
        },
        resultCode: "00225",
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
 * @swagger
 * /fridge/{id}:
 *   get:
 *     summary: Lấy chi tiết mục tủ lạnh (Fridge Item) theo ID
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth:
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID mục tủ lạnh cần lấy."
 *     responses:
 *       200:
 *         description: Lấy chi tiết thực phẩm trong tủ lạnh thành công (00228)
 *       404:
 *         description: Item không tìm thấy (404)
 *       500:
 *         description: Lỗi máy chủ
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
