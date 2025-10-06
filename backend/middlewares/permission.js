// middlewares/permission.js
import { supabase } from "../db.js";

export const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Lấy roles của user
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", userId);

      if (!userRoles?.length) {
        return res.status(403).json({ error: "No roles assigned" });
      }

      // Lấy permissions theo role
      const { data: rolePermissions } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .in("role_id", userRoles.map(r => r.role_id));

      const { data: permissions } = await supabase
        .from("permissions")
        .select("name")
        .in("id", rolePermissions.map(rp => rp.permission_id));

      const userPerms = permissions.map(p => p.name);

      if (!userPerms.includes(permissionName)) {
        return res.status(403).json({ error: "Forbidden: insufficient permissions" });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: "Permission check failed" });
    }
  };
};
