// controllers/userController.js
import { supabase, supabaseAdmin } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";

import {
  sendVerificationCodeService,
  verifyCodeService,
} from "../services/authService.js";

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
  if (!email || !password) {
    return res.status(400).json({
      resultCode: "00038",
      message: "Vui lòng cung cấp tất cả các trường bắt buộc!",
    });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error?.message?.includes("Email not confirmed")) {
        return res.status(403).json({
          resultCode: "00044",
          message: "Email của bạn chưa được xác minh, vui lòng xác minh email.",
        });
      }

      return res.status(400).json({
        resultCode: "00045",
        message: "Bạn đã nhập một email hoặc mật khẩu không hợp lệ.",
      });
    }

    return res.status(200).json({
      resultCode: "00047",
      message: "Bạn đã đăng nhập thành công",
      user: data.user,
      session: data.session,
    });
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
  }
};


/**
 * @swagger
 * /user:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *               - birthdate
 *               - gender
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: example@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 12345678
 *               username:
 *                 type: string
 *                 example: ducnguyen
 *               birthdate:
 *                 type: string
 *                 format: date
 *                 example: 2004-01-01
 *               gender:
 *                 type: string
 *                 example: male
 *     responses:
 *       200:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00035"
 *                 message:
 *                   type: string
 *                   example: Bạn đã đăng ký thành công. Vui lòng kiểm tra email để xác minh.
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc email đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00025"
 *                 message:
 *                   type: string
 *                   example: Vui lòng cung cấp tất cả các trường bắt buộc!
 *       500:
 *         description: Lỗi máy chủ
 */


export const register = async (req, res) => {
  const { email, password, username, birthdate, gender } = req.body;

  // ================= VALIDATE =================
  if (!email || !password || !username || !birthdate || !gender) {
    return res.status(400).json({
      resultCode: "00025",
      message: "Vui lòng cung cấp tất cả các trường bắt buộc!",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      resultCode: "00026",
      message: "Vui lòng cung cấp một địa chỉ email hợp lệ!",
    });
  }

  if (password.length < 6 || password.length > 20) {
    return res.status(400).json({
      resultCode: "00027",
      message:
        "Vui lòng cung cấp mật khẩu dài hơn 6 ký tự và ngắn hơn 20 ký tự.",
    });
  }

  if (username.length < 3 || username.length > 15) {
    return res.status(400).json({
      resultCode: "00081",
      message: "Tên người dùng phải dài từ 3 đến 15 ký tự.",
    });
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const deviceId = uuidv4();

    // ================= SIGN UP AUTH =================
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          gender,
          birthdate,
          language: "vi",
          timezone,
          deviceId,
        },
      },
    });

    if (error) {
      // Supabase tự check email trùng
      if (error.message.includes("already registered")) {
        return res.status(400).json({
          resultCode: "00032",
          message: "Một tài khoản với địa chỉ email này đã tồn tại.",
        });
      }

      return res.status(400).json({
        resultCode: "00008",
        message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
      });
    }

    const userId = data.user.id;

    // ================= INSERT PROFILE =================
    const { error: profileError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        email,
        username,
        gender,
        birthdate,
        language: "vi",
        imageurl: null,
        deviceid: deviceId,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Profile Insert Error:", profileError);
      return res.status(500).json({
        resultCode: "00008",
        message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
      });
    }

    return res.status(200).json({
      resultCode: "00035",
      message:
        "Bạn đã đăng ký thành công. Vui lòng kiểm tra email để xác minh.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
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
    await supabase.auth.signOut();
    return res.status(200).json({
      resultCode: "00050",
      message: "Đăng xuất thành công",
    });
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
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

  if (!refreshToken) {
    return res.status(400).json({
      resultCode: "00059",
      message: "Vui lòng cung cấp token làm mới.",
    });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      if (!data?.session) {
        return res.status(401).json({
          resultCode: "00061",
          message: "Token được cung cấp không khớp với người dùng.",
        });
      }
      return res.status(401).json({
        resultCode: "00062",
        message: "Token đã hết hạn, vui lòng đăng nhập.",
      });
    }

    return res.status(200).json({
      resultCode: "00065",
      message: "Token đã được làm mới thành công.",
      session: data.session,
    });
  } catch (err) {
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
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

  if (!email) {
    return res.status(400).json({
      resultCode: "00005",
      message: "Vui lòng cung cấp đầy đủ thông tin để gửi mã.",
    });
  }

  try {
    await sendVerificationCodeService(email);
    return res.status(200).json({
      resultCode: "00048",
      message: "Mã đã được gửi đến email của bạn thành công.",
    });
  } catch (error) {
    if (err.message?.includes("rate")) {
      return res.status(429).json({
        resultCode: "00024",
        message: "Quá nhiều yêu cầu.",
      });
    }
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
  }
};

/**
 * @swagger
 * /user/:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 */
export const getUser = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        resultCode: "00007",
        message: "ID người dùng không hợp lệ.",
      });
    }
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        resultCode: "00052",
        message: "Không thể tìm thấy người dùng.",
      });
    }

    return res.status(200).json({
      resultCode: "00089",
      message: "Thông tin người dùng đã được lấy thành công.",
      user: data,
    });
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
  }
};

/**
 * @swagger
 * /user/:
 *   delete:
 *     summary: Xóa tài khoản người dùng
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa tài khoản thành công
 */
export const deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;

    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabaseAdmin.from("users").delete().eq("id", userId);

    return res.status(200).json({
      resultCode: "00092",
      resultMessage: {
        vn: "Tài khoản của bạn đã bị xóa thành công.",
        en: "Your account has been deleted successfully.",
      },
    });
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
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

  if (!token) {
    return res.status(400).json({
      resultCode: "00053",
      message: "Vui lòng gửi một mã xác nhận.",
    });
  }

  try {
    const { error } = await supabase.auth.verifyOtp({
      token,
      type: "signup",
    });

    if (error) {
      return res.status(400).json({
        resultCode: "00054",
        message:
          "Mã bạn nhập không khớp với mã chúng tôi đã gửi đến email của bạn. Vui lòng kiểm tra lại.",
      });
    }

    return res.status(200).json({
      resultCode: "00058",
      message: "Địa chỉ email của bạn đã được xác minh thành công.",
    });
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
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

  if (!newPassword) {
    return res.status(400).json({
      resultCode: "00025",
      message: "Vui lòng cung cấp tất cả các trường bắt buộc!.",
    });
  }

  if (newPassword.length < 6 || newPassword.length > 20) {
    return res.status(400).json({
      resultCode: "00027",
      message:
        "Vui lòng cung cấp mật khẩu dài hơn 6 ký tự và ngắn hơn 20 ký tự.",
    });
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return res.status(400).json({
        resultCode: "00007",
        message: "Không thể đổi mật khẩu.",
      });
    }

    return res.status(200).json({
      resultCode: "00068",
      message: "Mật khẩu mới đã được tạo thành công.",
      user: data.user,
    });
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
  }
};

/**
 * @swagger
 * /user:
 *   put:
 *     summary: Chỉnh sửa thông tin người dùng (bao gồm upload ảnh)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
export const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("REQ BODY:", userId, req.body, req.file);
    const { username } = req.body;

    const updateData = {
      updatedat: new Date(),
    };

    if (username) updateData.username = username;

    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const filePath = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("avatars")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (!uploadError) {
        const { data } = supabaseAdmin.storage
          .from("avatars")
          .getPublicUrl(filePath);

        updateData.imageurl = data.publicUrl;
      }
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      return res.status(400).json({
        resultCode: "00008",
        message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại1.",
      });
    }

    return res.status(200).json({
      resultCode: "00086",
      message: "Thông tin hồ sơ của bạn đã được thay đổi thành công.",
    });
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
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
    const ownerId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from("groups")
      .insert({ owner_id: ownerId })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("group_members").insert({
      group_id: data.id,
      user_id: ownerId,
    });

    return res.status(200).json({
      resultCode: "00095",
      resultMessage: {
        vn: "Tạo nhóm thành công",
        en: "Group created successfully",
      },
      groupId: data.id,
    });
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ.",
    });
  }
};

/**
 * @swagger
 * /user/group/add:
 *   post:
 *     summary: Thêm thành viên vào nhóm
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [username]
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thêm thành viên thành công
 */
export const addMember = async (req, res) => {
  const { username } = req.body;
  const ownerId = req.user.id;

  if (!username) {
    return res.status(400).json({
      resultCode: "00100",
      message: "Thiếu username",
    });
  }

  try {
    const { data: group } = await supabaseAdmin
      .from("groups")
      .select("id")
      .eq("owner_id", ownerId)
      .single();

    if (!group) {
      return res.status(403).json({
        resultCode: "00096",
        message: "Bạn chưa tạo nhóm",
      });
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (!user) {
      return res.status(404).json({
        resultCode: "00099",
        message: "Không tồn tại user này",
      });
    }

    await supabaseAdmin.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
    });

    return res.status(200).json({
      resultCode: "00102",
      message: "Người dùng thêm vào nhóm thành công",
    });
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Lỗi máy chủ nội bộ",
    });
  }
};

/**
 * @swagger
 * /user/group/:
 *   delete:
 *     summary: Xóa thành viên khỏi nhóm
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [username]
 *             properties:
 *               username:
 *                 type: string
 */
export const deleteMember = async (req, res) => {
  const { username } = req.body;
  const ownerId = req.user.id;

  try {
    const { data: group } = await supabaseAdmin
      .from("groups")
      .select("id")
      .eq("owner_id", ownerId)
      .single();

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (!user) {
      return res.status(404).json({
        resultCode: "00099",
        message: "Không tồn tại user này",
      });
    }

    await supabaseAdmin
      .from("group_members")
      .delete()
      .eq("group_id", group.id)
      .eq("user_id", user.id);

    return res.status(200).json({
      resultCode: "00106",
      message: "Xóa thành công",
    });
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Lỗi máy chủ nội bộ",
    });
  }
};

/**
 * @swagger
 * /user/group/:
 *   get:
 *     summary: Lấy danh sách thành viên trong nhóm
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành viên thành công
 */
export const getGroupMembers = async (req, res) => {
  const ownerId = req.user.id;

  try {
    const { data: group } = await supabaseAdmin
      .from("groups")
      .select("id")
      .eq("owner_id", ownerId)
      .single();

    if (!group) {
      return res.status(404).json({
        resultCode: "00096",
        message: "Bạn không thuộc về nhóm nào",
      });
    }

    const { data } = await supabaseAdmin
      .from("group_members")
      .select("users(username, email, photourl)")
      .eq("group_id", group.id);

    return res.status(200).json({
      resultCode: "00098",
      message: "Thành công",
      members: data,
    });
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Lỗi máy chủ nội bộ",
    });
  }
};

/**
 * @swagger
 * /user/verify-code:
 *   post:
 *     summary: Xác nhận mã OTP gửi về email
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xác minh thành công
 */
export const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      resultCode: "00053",
      message: "Vui lòng cung cấp email và mã xác nhận.",
    });
  }

  try {
    await verifyCodeService(email, code);

    return res.status(200).json({
      resultCode: "00058",
      message: "Mã xác thực hợp lệ.",
    });
  } catch (err) {
    if (err.message === "INVALID_CODE") {
      return res.status(400).json({
        resultCode: "00054",
        message: "Mã xác thực không đúng.",
      });
    }

    if (err.message === "CODE_EXPIRED") {
      return res.status(400).json({
        resultCode: "00055",
        message: "Mã xác thực đã hết hạn.",
      });
    }

    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ.",
    });
  }
};
