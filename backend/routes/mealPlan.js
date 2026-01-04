// routes/shoppingList.js
import express from "express";
import {
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getAllMealPlans,
  getMealPlansById,
  searchMealPlansByName,
} from "../controllers/mealPlanController.js";
import { requirePermission } from "../middlewares/permission.js";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(supabaseAuth);

router.post("/", createMealPlan);
router.put("/", updateMealPlan);
router.delete("/", deleteMealPlan);
router.post("/getAll", getAllMealPlans);
router.post("/detail", getMealPlansById);
router.post("/search", searchMealPlansByName);

export default router;
