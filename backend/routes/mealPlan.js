// routes/shoppingList.js
import express from "express";
import {
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getMealPlansByDate,
} from "../controllers/mealPlanController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js"; // Adjust path as needed

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

router.post("/create", createMealPlan);
router.put("/update", updateMealPlan);
router.delete("/delete", deleteMealPlan);
router.get("/get-by-date", getMealPlansByDate);

export default router;
