// middlewares/permissions.js
import { supabase } from "../db.js";

export const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id; // JWT decode từ auth middleware

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized: missing user" });
      }

      // =============================
      // 1) Lấy danh sách role của user
      // =============================
      const { data: userRoles, error: roleErr } = await supabase
        .from("user_role")
        .select("role_id")
        .eq("user_id", userId);

      if (roleErr) {
        return res.status(500).json({ error: "Failed to fetch user roles" });
      }

      if (!userRoles || userRoles.length === 0) {
        return res.status(403).json({ error: "User has no roles" });
      }

      const roleIds = userRoles.map(r => r.role_id);

      // =============================
      // 2) JOIN ra danh sách permission từ roles
      // =============================
      const { data: permissions, error: permErr } = await supabase
        .from("role_permission")
        .select(`
          permission:permissions(name)
        `)
        .in("role_id", roleIds);

      if (permErr) {
        return res.status(500).json({ error: "Failed to fetch permissions" });
      }

      const userPerms = permissions?.map(p => p.permission?.name) || [];

      if (!userPerms.includes(permissionName)) {
        return res.status(403).json({ error: "Forbidden: missing permission '" + permissionName + "'" });
      }

      // =============================
      // 3) Cho phép đi tiếp
      // =============================
      next();

    } catch (err) {
      console.error("Permission middleware error:", err);
      return res.status(500).json({ error: "Permission check failed" });
    }
  };
};