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
  getFoodByName,
} from "../controllers/foodController.js";
import { requirePermission } from "../middlewares/permission.js";
import { userContext } from "../middlewares/userContext.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(userContext);
/**
 * FOOD ROUTES
 */
router.post('/create', upload.single('image'), createFood); 
router.put('/update', upload.single('image'), updateFood);
router.delete("/delete", deleteFood); // Xóa không cần gửi file
router.get("/list", getFoodsByGroup); // Lấy list không cần file
router.get("/unit", getUnits);
router.get("/category", getCategories);
router.get("/list/:foodName", getFoodByName);

export default router;
