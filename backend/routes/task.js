// routes/shoppingList.js
import express from "express";
import {
  createTasks,
  markTask,
  deleteTask,
  updateTask,
} from "../controllers/taskController.js";

import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(supabaseAuth);

// Tasks Routes
router.post("/", createTasks);
router.patch("/", markTask);
router.put("/", updateTask);
router.delete("/", deleteTask);

export default router;
