// controllers/usersController.js

import { supabase } from "../config/supabaseClient.js";
/**
 * @swagger
 * /user:
 *   get:
 *     summary: Lấy thông tin user
 *     security:
 *       - bearerAuth: []
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Lấy user thành công
 */
export const getUser = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user:
 *   delete:
 *     summary: Xóa tài khoản
 *     security:
 *       - bearerAuth: []
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
export const deleteUser = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.deleteUser(req.user.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "User deleted", data });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};