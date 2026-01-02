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
router.post("/create/:groupId", createShoppingList);
router.get("/getAll/:groupId", getAllShoppingLists);
router.put("/update/:groupId", updateShoppingList);
router.delete("/delete/:groupId", deleteShoppingList);

// Tasks Routes
router.post("/task/:groupId", createTasks);
router.put("/task/mark", markTask);
router.put("/task/update", updateTask);
router.delete("/task/delete/:groupId", deleteTask);

export default router;
