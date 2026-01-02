// routes/fridge.js
import express from "express";
import {
  createFridgeItem,
  updateFridgeItem,
  deleteFridgeItem,
  getFridgeItems,
  getSpecificFridgeItem,
} from "../controllers/fridgeController.js";
import { requirePermission } from "../middlewares/permission.js";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const router = express.Router();

router.use(supabaseAuth);
/**
 * FRIDGE ROUTES
 */
router.post("/create", createFridgeItem);        // Thêm thực phẩm vào tủ
router.put("/update", updateFridgeItem);         // Cập nhật thực phẩm
router.delete("/delete", deleteFridgeItem);      // Xóa khỏi tủ
router.get("/list", getFridgeItems);           // Lấy tất cả thực phẩm trong tủ
router.get("/list/:foodName", getSpecificFridgeItem);     // Lấy chi tiết 1 thực phẩm trong tủ

export default router;
