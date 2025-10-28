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
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * CATEGORY ROUTES
 */
router.post("/categories", authMiddleware, createCategory);
router.get("/categories", authMiddleware, getAllCategories);
router.put("/categories", authMiddleware, updateCategory);
router.delete("/categories", authMiddleware, deleteCategory);

/**
 * UNIT ROUTES
 */
router.post("/units", authMiddleware, createUnit);
router.get("/units", authMiddleware, getAllUnits);
router.put("/units", authMiddleware, updateUnit);
router.delete("/units", authMiddleware, deleteUnit);

export default router;
