// middlewares/permission.js
import { supabaseAdmin } from "../db.js";

/**
 * Middleware kiểm tra permission của user
 * @param {string} permissionName - tên permission cần kiểm tra
 */
export const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // =============================
      // 0) Kiểm tra user từ auth middleware
      // =============================
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          resultCode: "00006",
          message: "Truy cập bị từ chối. Không có token được cung cấp.",
        });
      }

      // =============================
      // 1) Lấy role của user
      // =============================
      const { data: userRoles, error: roleErr } = await supabaseAdmin
        .from("user_role")
        .select("role_id")
        .eq("user_id", userId);

      if (roleErr) {
        console.error("Fetch user_role error:", roleErr);
        return res.status(500).json({
          resultCode: "00008",
          message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
        });
      }

      if (!userRoles || userRoles.length === 0) {
        return res.status(403).json({
          resultCode: "00017",
          message: "Truy cập bị từ chối. Bạn không có quyền truy cập.",
        });
      }

      const roleIds = userRoles.map((r) => r.role_id);

      // =============================
      // 2) Lấy permission từ role
      // =============================
      const { data: rolePermissions, error: permErr } = await supabaseAdmin
        .from("role_permission")
        .select(
          `
          permissions (
            name
          )
        `
        )
        .in("role_id", roleIds);

      if (permErr) {
        console.error("Fetch permissions error:", permErr);
        return res.status(500).json({
          resultCode: "00008",
          message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
        });
      }

      const userPermissions =
        rolePermissions?.map((p) => p.permissions?.name).filter(Boolean) || [];

      // =============================
      // 3) Kiểm tra permission
      // =============================
      if (!userPermissions.includes(permissionName)) {
        return res.status(403).json({
          resultCode: "00019",
          message: "Truy cập bị từ chối. Bạn không có quyền truy cập.",
        });
      }

      // =============================
      // 4) Cho phép đi tiếp
      // =============================
      next();
    } catch (err) {
      console.error("Permission middleware error:", err);
      return res.status(500).json({
        resultCode: "00008",
        message: "Đã xảy ra lỗi máy chủ nội bộ, vui lòng thử lại.",
      });
    }
  };
};

export const requireGroupPermission = (permissionName) => {
  return async (req, res, next) => {
    const userId = req.user.id;
    const { groupId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("group_members")

      .select(
        `

        group_roles (
          group_role_permissions (
            group_permissions (name)
          )
        )

      `
      )

      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return res.status(403).json({ error: "Not a group member" });
    }

    const perms = data.group_roles.group_role_permissions.map(
      (rp) => rp.group_permissions.name
    );

    if (!perms.includes(permissionName)) {
      return res.status(403).json({
        error: "Missing group permission: " + permissionName,
      });
    }

    next();
  };
};
