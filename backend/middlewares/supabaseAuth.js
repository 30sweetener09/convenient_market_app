// import { supabaseAdmin } from "../db.js";

// export const supabaseAuth = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     // 00006 – Không có token
//     if (!authHeader) {
//       return res.status(401).json({
//         resultCode: "00006",
//         message: "Truy cập bị từ chối. Không có token được cung cấp.",
//       });
//     }

//     const token = authHeader.replace("Bearer ", "");

//     const { data, error } = await supabaseAdmin.auth.getUser(token);

//     // 00012 – Token không hợp lệ
//     if (error || !data?.user) {
//       return res.status(401).json({
//         resultCode: "00012",
//         message: "Token không hợp lệ. Token có thể đã hết hạn.",
//       });
//     }

//     req.user = data.user;
//     next();
//   } catch {
//     return res.status(500).json({
//       resultCode: "00008",
//       message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
//     });
//   }
// };

import { supabaseAdmin, supabase } from "../db.js";

export const supabaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 00006 – Không có token
    if (!authHeader) {
      return res.status(401).json({
        resultMessage: { vn: "Truy cập bị từ chối. Không có token được cung cấp." },
        resultCode: "00006",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // 1. Xác thực Token với Supabase Auth
    const { data: authData, error } = await supabaseAdmin.auth.getUser(token);

    // 00012 – Token không hợp lệ
    if (error || !authData?.user) {
      return res.status(401).json({
        resultMessage: { vn: "Token không hợp lệ. Token có thể đã hết hạn." },
        resultCode: "00012",
      });
    }

    // 2. Query bảng 'users' để lấy ID nội bộ
    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", authData.user.email)
      .single();

    if (!dbUser) {
       return res.status(404).json({
          resultMessage: { vn: "Không tìm thấy thông tin người dùng trong hệ thống." },
          resultCode: "00009" 
       });
    }

    // 3. Query bảng 'group_users' để lấy groupId
    const { data: groupUser } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", dbUser.id)
        .maybeSingle();

    // 4. Gán đầy đủ thông tin vào req.user
    req.user = {
      ...authData.user, 
      id: dbUser.id,
      groupId: groupUser?.group_id || null
    };

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(500).json({
      resultCode: "00008",
      message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
    });
  }
};
