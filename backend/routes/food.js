// routes/food.js
import express from "express";
import {
  createFood,
  updateFood,
  deleteFood,
  getFoodsByGroup,
  getFoodById
} from "../controllers/foodController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * FOOD ROUTES
 */
router.post("/", authMiddleware, createFood);       // Thêm thực phẩm
router.put("/", authMiddleware, updateFood);        // Cập nhật
router.delete("/", authMiddleware, deleteFood);     // Xóa
router.get("/", authMiddleware, getAllFoods);       // Lấy danh sách tất cả food
router.get("/:id", authMiddleware, getFoodById);    // Lấy chi tiết food theo id

export default router;
