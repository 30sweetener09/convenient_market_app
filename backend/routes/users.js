import express from "express";
import { getUser, deleteUser } from "../controllers/usersController.js";

const router = express.Router();

router.get("/user", getUser);
router.delete("/user", deleteUser);


export default router;