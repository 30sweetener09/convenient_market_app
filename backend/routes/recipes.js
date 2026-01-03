// routes/recipe.js
import express from "express";
import { uploadMiddleware } from "../middlewares/uploadMiddleware.js";
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getAllRecipes,
} from "../controllers/recipeController.js";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const recipeRoutes = express.Router();

// Áp dụng auth cho tất cả routes
recipeRoutes.use(supabaseAuth);

// Routes
recipeRoutes.post("/", uploadMiddleware, createRecipe);
recipeRoutes.put("/", uploadMiddleware, updateRecipe); // Nên có ID
recipeRoutes.delete("/", deleteRecipe); // Nên có ID
recipeRoutes.get("/", getAllRecipes);

export default recipeRoutes;
