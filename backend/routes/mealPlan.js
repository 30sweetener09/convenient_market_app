// routes/shoppingList.js
import express from "express";
import {
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getMealPlansByDate,
} from "../controllers/mealPlanController.js";
import { requirePermission } from "../middlewares/permission.js";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(supabaseAuth);

router.post("/:groupId", createMealPlan);
router.put("/:groupId", updateMealPlan);
router.delete("/:groupId", deleteMealPlan);
router.get("/get-by-date", getMealPlansByDate);

export default router;
