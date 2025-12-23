// routes/users.js
import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  sendVerificationCode,
  verifyEmail,
  changePassword,
  getUser,
  deleteUser
} from "../controllers/userController.js";

import { requirePermission } from "../middlewares/permission.js";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const router = express.Router();

// PUBLIC
router.post("/login", login);
router.post("/", register);
router.post("/refresh-token", refreshToken);
router.post("/send-verification-code", sendVerificationCode);
router.post("/verify-email", verifyEmail);

// PROTECTED (token required)
router.post("/logout", supabaseAuth, logout);
router.post("/change-password", supabaseAuth, changePassword);
router.get("/", supabaseAuth, getUser);

// ONLY ADMIN PERMISSION
router.delete("/", supabaseAuth, requirePermission("delete_user"), deleteUser);
router.post("/group", supabaseAuth);


export default router;
