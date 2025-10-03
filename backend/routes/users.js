import express from "express";
import { register, login, logout, refreshToken, sendVerificationCode,verifyEmail, changePassword, getUser, deleteUser } from "../controllers/userController.js";

const router = express.Router();


router.post("/login", login);
router.post("/", register);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.post("/send-verification-code", sendVerificationCode);
router.post("/verify-email", verifyEmail);
router.post("/change-password", changePassword);
router.get("/", getUser);
router.delete("/", deleteUser);

export default router;
