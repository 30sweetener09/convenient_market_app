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
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Shopping List routes
router.post("/create", authMiddleware, createShoppingList);
router.put("/update", authMiddleware, updateShoppingList);
router.delete("/delete", authMiddleware, deleteShoppingList);

// Tasks Routes
router.post("/tasks/create", createTasks);
router.get("/tasks/list", getListOfTasks);
router.put("/tasks/mark", markTask);
router.delete("/tasks/delete", deleteTask);
router.put("/tasks/update", updateTask);

export default router;
