// routes/shoppingList.js
import express from "express";
import {
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getMealPlansByDate,
} from "../controllers/mealPlanController.js";
import { authenticateToken } from "../middleware/auth.js"; // Adjust path as needed

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get("/", getMealPlansByDate);
router.post("/", createMealPlan);
router.put("/", updateMealPlan);
router.delete("/", deleteMealPlan);

export default router;
