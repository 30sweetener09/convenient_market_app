// routes/recipe.js
import express from "express";
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipesByFoodId,
} from "../controllers/recipeController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js"; // Adjust path as needed

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get("/", getRecipesByFoodId);
router.post("/", createRecipe);
router.put("/", updateRecipe);
router.delete("/", deleteRecipe);

export default router;
