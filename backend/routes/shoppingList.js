// routes/shoppingList.js
import express from "express";
import {
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  createTasks,
  getListOfTasks,
  markTask,
  deleteTask,
  updateTask,
} from "../controllers/shoppingListController.js";
import { authenticateToken } from "../middleware/auth.js"; // Adjust path as needed

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Shopping List routes
router.get("/", getListOfTasks);
router.post("/", createShoppingList);
router.put("/", updateShoppingList);
router.delete("/", deleteShoppingList);
router.post("/tasks", createTasks);
router.put("/tasks", updateTask);
router.put("/tasks/mark", markTask);
router.delete("/tasks", deleteTask);

export default router;
