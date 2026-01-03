// routes/shoppingList.js
import express from "express";
import {
  createShoppingList,
  getAllShoppingLists,
  updateShoppingList,
  deleteShoppingList,
  createTasks,
  markTask,
  deleteTask,
  updateTask,
} from "../controllers/shoppingListController.js";
import { requirePermission } from "../middlewares/permission.js";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(supabaseAuth);

// Shopping List routes
router.post("/", createShoppingList);
router.get("/", getAllShoppingLists);
router.put("/", updateShoppingList);
router.delete("/", deleteShoppingList);

// Tasks Routes
router.post("/task", createTasks);
router.put("/task/mark", markTask);
router.put("/task/", updateTask);
router.delete("/task", deleteTask);

export default router;
