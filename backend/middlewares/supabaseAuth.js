import { supabaseAdmin } from "../db.js";

export const supabaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 00006 – Không có token
    if (!authHeader) {
      return res.status(401).json({
        resultCode: "00006",
        message: "Truy cập bị từ chối. Không có token được cung cấp.",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    // 00012 – Token không hợp lệ
    if (error || !data?.user) {
      return res.status(401).json({
        resultCode: "00012",
        message: "Token không hợp lệ. Token có thể đã hết hạn.",
      });
    }

    req.user = data.user;
    next();
  } catch {
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
  }
};
