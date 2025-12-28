// routes/admin.js
import express from "express";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  createUnit,
  getAllUnits,
  updateUnit,
  deleteUnit,
} from "../controllers/adminController.js";
import { requirePermission } from "../middlewares/permission.js";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const router = express.Router();

router.use(supabaseAuth);
/**
 * CATEGORY ROUTES
 */
router.post("/category/create", createCategory);
router.get("/category/list", getAllCategories);
router.put("/category/update", updateCategory);
router.delete("/category/delete", deleteCategory);

/**
 * UNIT ROUTES
 */
router.post("/units/create", createUnit);
router.get("/units/list", getAllUnits);
router.put("/units/update", updateUnit);
router.delete("/units/delete", deleteUnit);

export default router;
