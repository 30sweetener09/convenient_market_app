// routes/recipe.js
import express from "express";
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipesByFoodId,
} from "../controllers/recipeController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js"; // Adjust path as needed

const recipeRoutes = express.Router();

// Apply authentication middleware to all routes
recipeRoutes.use(authMiddleware);

recipeRoutes.get("/", getRecipesByFoodId);
recipeRoutes.post("/", createRecipe);
recipeRoutes.put("/", updateRecipe);
recipeRoutes.delete("/", deleteRecipe);

export default recipeRoutes;
