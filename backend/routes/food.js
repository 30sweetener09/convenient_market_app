// routes/food.js
import express from "express";
import multer from 'multer';
import {
  createFood,
  updateFood,
  deleteFood,
  getFoodsByGroup,
  getUnits,
  getCategories,
} from "../controllers/foodController.js";
import { requirePermission } from "../middlewares/permission.js";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(supabaseAuth);
/**
 * FOOD ROUTES
 */
router.post('/create', supabaseAuth, upload.single('image'), createFood); // Thêm thực phẩm
router.put('/update', supabaseAuth, upload.single('image'), updateFood); // Cập nhật
router.delete("/delete",supabaseAuth, upload.single('image'), deleteFood); // Xóa
router.get("/list",supabaseAuth, upload.single('image'), getFoodsByGroup); // Lấy danh sách tất cả food
router.get("/unit",supabaseAuth, upload.single('image'), getUnits);
router.get("/category",supabaseAuth, upload.single('image'), getCategories);

export default router;
