// controllers/shoppingListController.js
import { supabase } from "../db.js";

/**
 * @swagger
 * /shoppingList:
 *   post:
 *     summary: Tạo danh sách mua sắm mới
 *     tags: [ShoppingList]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Danh sách mua sắm hôm nay"
 *               assignToUsername:
 *                 type: string
 *                 example: "member6320"
 *               note:
 *                 type: string
 *                 example: "Mua thêm trái cây và sữa"
 *               date:
 *                 type: string
 *                 example: "2025-10-26"
 *     responses:
 *       200:
 *         description: Tạo danh sách mua sắm thành công
 */
export const createShoppingList = async (req, res) => {
  try {
    const { name, assignToUsername, note, date } = req.body;

    // ✅ Kiểm tra dữ liệu đầu vào
    if (!name || !assignToUsername || !date) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing required fields",
          vn: "Thiếu thông tin bắt buộc",
        },
        resultCode: "400",
      });
    }

    // ✅ Ghi vào Supabase (bảng: shopping_list)
    const { data, error } = await supabase
      .from("shopping_list")
      .insert([
        {
          name,
          note,
          assign_to_username: assignToUsername,
          date,
          belongs_to_admin_id: req.user?.id || 1, // tạm dùng id admin 1
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // ✅ Trả về phản hồi
    res.status(200).json({
      resultMessage: {
        en: "Shopping list created successfully.",
        vn: "Tạo danh sách mua sắm thành công.",
      },
      resultCode: "00249",
      createdShoppingList: data,
    });
  } catch (err) {
    console.error("Error creating shopping list:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
