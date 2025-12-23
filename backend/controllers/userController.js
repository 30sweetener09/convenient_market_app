// controllers/userController.js
import { supabase, supabaseAdmin } from "../db.js";
import { v4 as uuidv4 } from "uuid";

/**
 * @swagger
 * tags:
 *   name: User
 *   description: API liên quan đến tài khoản người dùng
 */

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      resultCode: "00001",
      message: "Login success",
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Đăng ký thành công
 */
export const register = async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name)
    return res
      .status(400)
      .json({ error: "Email, password and name are required" });

  try {
    const language = "vi";
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const deviceId = uuidv4();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, language, timezone, deviceId },
      },
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      resultCode: "00002",
      message: "Register success",
      user: data.user,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: Đăng xuất người dùng
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
export const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });

    return res.json({ resultCode: "00003", message: "Logged out" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/refresh-token:
 *   post:
 *     summary: Làm mới access token
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Token được làm mới
 */
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).json({ error: "refreshToken required" });

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      resultCode: "00004",
      message: "Token refreshed",
      session: data.session,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/send-verification-code:
 *   post:
 *     summary: Gửi mã xác minh email
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Đã gửi mã xác minh
 */
export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      resultCode: "00005",
      message: "Verification code sent",
      data,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/verify-email:
 *   post:
 *     summary: Xác minh email
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Xác minh thành công
 */
export const verifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token)
    return res.status(400).json({ error: "Verification token required" });

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token,
      type: "signup",
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      resultCode: "00006",
      message: "Email verified",
      user: data.user,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/change-password:
 *   post:
 *     summary: Đổi mật khẩu
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
export const changePassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword)
    return res.status(400).json({ error: "newPassword required" });

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      resultCode: "00007",
      message: "Password changed",
      user: data.user,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/:
 *   get:
 *     summary: Lấy thông tin người dùng từ access token
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 */
export const getUser = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      resultCode: "00008",
      user: data.user,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/:
 *   delete:
 *     summary: Xóa tài khoản (chỉ Admin hoặc chính chủ)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa tài khoản thành công
 */
export const deleteUser = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.user.id);

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      resultCode: "00092",
      resultMessage: {
        en: "Your account was deleted successfully.",
        vn: "Tài khoản của bạn đã bị xóa thành công.",
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/group:
 *   post:
 *     summary: Tạo nhóm mới
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tạo nhóm thành công
 */
export const createGroup = async (req, res) => {
  try {
    const adminId = req.user.id;

    return res.json({
      resultCode: "00095",
      resultMessage: {
        en: "Your group has been created successfully",
        vn: "Tạo nhóm thành công",
      },
      adminId: adminId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
