import express from "express";
import {supabase} from "../db.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               full_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng ký thành công
 */
router.post("/register", async (req, res) => {
  const { email, password, full_name } = req.body;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Register success", user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Login success", session: data.session, user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post("/logout", async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
