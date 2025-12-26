// routes/fridge.js
import express from "express";
import {
  createFridgeItem,
  updateFridgeItem,
  deleteFridgeItem,
  getFridgeItems,
  getFridgeItemById,
} from "../controllers/fridgeController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * FRIDGE ROUTES
 */
router.post("/", authMiddleware, createFridgeItem);        // Thêm thực phẩm vào tủ
router.put("/", authMiddleware, updateFridgeItem);         // Cập nhật thực phẩm
router.delete("/", authMiddleware, deleteFridgeItem);      // Xóa khỏi tủ
router.get("/", authMiddleware, getFridgeItems);           // Lấy tất cả thực phẩm trong tủ
router.get("/:id", authMiddleware, getFridgeItemById);     // Lấy chi tiết 1 thực phẩm trong tủ

export default router;
