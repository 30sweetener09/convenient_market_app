import { supabaseAdmin, supabase } from "../db.js";

export const userContext = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Kiểm tra Token
    if (!authHeader) {
      return res.status(401).json({
        resultMessage: { vn: "Truy cập bị từ chối. Không có token được cung cấp." },
        resultCode: "00006",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // 2. Xác thực với Supabase Auth
    const { data: authData, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !authData?.user) {
      return res.status(401).json({
        resultMessage: { vn: "Token không hợp lệ hoặc hết hạn." },
        resultCode: "00012",
      });
    }

    // 3. Lấy ID số nguyên từ bảng 'users' nội bộ
    // (Bảng users của bạn dùng UUID làm ID chính, trùng với Auth ID)
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, email, name, imageurl")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (!dbUser) {
       return res.status(404).json({
          resultMessage: { vn: "Không tìm thấy thông tin người dùng trong hệ thống." },
          resultCode: "00009" 
       });
    }

    // 4. Lấy danh sách Group mà user tham gia (Dựa trên bảng group_members)
    const { data: memberRows } = await supabase
        .from("group_members") 
        .select("group_id, role_in_group")
        .eq("user_id", dbUser.id);

    // Tạo mảng danh sách ID nhóm: [1, 2, 5...]
    // Nếu memberRows null (chưa vào nhóm nào) thì gán mảng rỗng []
    const groupIds = memberRows ? memberRows.map(row => row.group_id) : [];

    // 5. Gán vào req.user (QUAN TRỌNG: Phải có groupIds)
    req.user = {
      ...authData.user,            
      uuid: authData.user.id,      
      id: dbUser.id,               
      
      // --- KHẮC PHỤC LỖI Ở ĐÂY ---
      groupIds: groupIds,          // Controller đang đọc biến này, nếu thiếu sẽ crash
      // ---------------------------
      
      profile: {
          name: dbUser.name,
          avatar: dbUser.imageurl
      }
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