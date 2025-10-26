// routes/shoppingList.js
import express from "express";
import { createShoppingList } from "../controllers/shoppingListController.js";

const router = express.Router();

// POST /api/shoppingList
router.post("/", createShoppingList);

export default router;
