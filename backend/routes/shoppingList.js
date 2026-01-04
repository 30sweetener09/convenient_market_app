// routes/shoppingList.js
import express from "express";
import {
  createShoppingList,
  getAllShoppingLists,
  updateShoppingList,
  deleteShoppingList,
} from "../controllers/shoppingListController.js";
import { requirePermission } from "../middlewares/permission.js";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(supabaseAuth);

// Shopping List routes
router.post("/", createShoppingList);
router.post("/getAll", getAllShoppingLists);
router.put("/", updateShoppingList);
router.delete("/", deleteShoppingList);

export default router;
