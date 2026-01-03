import { supabaseAdmin, supabase } from "../db.js";

export const userContext = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Kiểm tra Token (Mã 00006)
    if (!authHeader) {
      return res.status(401).json({
        resultMessage: { vn: "Truy cập bị từ chối. Không có token được cung cấp." },
        resultCode: "00006",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // 2. Xác thực với Supabase Auth (Mã 00012)
    const { data: authData, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !authData?.user) {
      return res.status(401).json({
        resultMessage: { vn: "Token không hợp lệ. Token có thể đã hết hạn." },
        resultCode: "00012",
      });
    }

    // 3. Lấy ID số nguyên từ bảng 'users' nội bộ
    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", authData.user.email)
      .maybeSingle();

    if (!dbUser) {
       return res.status(404).json({
          resultMessage: { vn: "Không tìm thấy thông tin người dùng trong hệ thống." },
          resultCode: "00009" 
       });
    }

    // 4. Lấy Group ID (nếu có)
    const { data: groupUser } = await supabase
        .from("group_members") 
        .select("group_id")
        .eq("user_id", dbUser.id)
        .maybeSingle();

    // 5. Gán vào req.user (QUAN TRỌNG: Giữ cả UUID và ID số)
    req.user = {
      ...authData.user,
      uuid: authData.user.id,
      id: dbUser.id,
      groupId: groupUser?.group_id || null
    };

    next();
  } catch (err) {
    console.error("UserContext Middleware Error:", err);
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ.",
    });
  }
};
