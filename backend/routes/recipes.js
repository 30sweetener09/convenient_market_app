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

recipeRoutes.post("/create", createRecipe);
recipeRoutes.put("/update", updateRecipe);
recipeRoutes.delete("/delete", deleteRecipe);
recipeRoutes.get("/get-by-food", getRecipesByFoodId);

export default recipeRoutes;
