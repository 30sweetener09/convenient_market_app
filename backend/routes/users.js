// routes/users.js
import express from "express";
import {upload} from "../middlewares/upload.js";
import {
  login,
  register,
  logout,
  refreshToken,
  sendVerificationCode,
  getUser,
  deleteUser,
  verifyEmail,
  changePassword,
  updateUser,
  verifyCode,
  getUserById,
  registerUserDevice,
} from "../controllers/userController.js";

import { requirePermission } from "../middlewares/permission.js";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const router = express.Router();

router.post("/login", login);
router.post("/", upload.single("avatar"), register);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.post("/send-verification-code", sendVerificationCode);
router.get("/", supabaseAuth, getUser);
router.post("/detail", supabaseAuth, getUserById);

router.delete("/", supabaseAuth, deleteUser);

router.post("/verify-email", verifyEmail);
router.post("/verify-code", verifyCode);
router.post("/change-password", supabaseAuth, changePassword);

router.put("/", supabaseAuth, upload.single("avatar"), updateUser);
router.post("/devices/register", supabaseAuth, registerUserDevice);


export default router;
