// routes/recipe.js
import express from "express";
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipesByFoodId,
  getAllRecipes,
} from "../controllers/recipeController.js";
import { requirePermission } from "../middlewares/permission.js";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const recipeRoutes = express.Router();

// Apply authentication middleware to all routes
recipeRoutes.use(supabaseAuth);

recipeRoutes.post("", createRecipe);
recipeRoutes.put("", updateRecipe);
recipeRoutes.delete("", deleteRecipe);
recipeRoutes.get("/byFoodId", getRecipesByFoodId);
recipeRoutes.get("", getAllRecipes);

export default recipeRoutes;
