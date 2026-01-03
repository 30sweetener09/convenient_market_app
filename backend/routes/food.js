// routes/food.js
import express from "express";
import multer from "multer";
import {
  createFood,
  updateFood,
  deleteFood,
  getAllFoods,
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

router.post("/", upload.single("image"), createFood);
router.put("/", upload.single("image"), updateFood);
router.delete("/", deleteFood);
router.get("/", getAllFoods);
router.get("/unit", getUnits);
router.get("/category", getCategories);
router.get("/list/:foodName", getFoodByName);

export default router;
