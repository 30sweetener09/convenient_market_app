// controllers/userController.js
import { supabase } from "../db.js";
import { v4 as uuidv4 } from "uuid";


/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
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
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Login success", session: data.session, user: data.user });

    console.log(data.session.access_token);  // JWT

  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};


/**
 * @swagger
 * /user/:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               language:
 *                 type: string
 *               timezone:
 *                 type: string
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng ký thành công
 */
export const register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password and name are required" });
  }

  try {
    const language = "vi"; // mặc định
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // lấy timezone server
    const deviceId = uuidv4(); // tự sinh

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, language, timezone, deviceId } },
    });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Register success", user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
export const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Logged out" });

    console.log("User logged out");
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/refresh-token:
 *   post:
 *     summary: Làm mới access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Refresh thành công
 */
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Token refreshed", session: data.session });

    console.log(data.session.access_token);  // JWT

  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};


/**
 * @swagger
 * /user/send-verification-code:
 *   post:
 *     summary: Gửi mã xác minh đến email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Đã gửi mã
 */
export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Verification code sent", data });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};




/**
 * @swagger
 * /user/verify-email:
 *   post:
 *     summary: Xác minh email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Xác minh thành công
 */
export const verifyEmail = async (req, res) => {
  const { code, token } = req.body;
  if (!code || !token) return res.status(400).json({ error: "Code and token required" });

  try {
    const { data, error } = await supabase.auth.verifyOtp({ token, type: "signup" });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Email verified", user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};


/**
 * @swagger
 * /user/change-password:
 *   post:
 *     summary: Đổi mật khẩu
 *     security:
 *       - bearerAuth: []
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: "Both old and new password required" });

  try {
    // Supabase không hỗ trợ đổi mật khẩu trực tiếp bằng oldPassword → thường sẽ dùng updateUser
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Password changed", user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @swagger
 * /user/:
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
 * /user/:
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