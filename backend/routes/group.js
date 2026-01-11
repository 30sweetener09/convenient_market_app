// routes/group.js
import express from "express";
import { supabaseAuth } from "../middlewares/supabaseAuth.js";
import { upload } from "../middlewares/upload.js";

import {
  getGroups,
  getGroupsByName,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  deleteMember,
  getGroupMembers,
  getGroupsMemberByName,
} from "../controllers/groupController.js";

const router = express.Router();

router.use(supabaseAuth);

/**
 * GROUP
 */
router.get("/", getGroups); // danh sách group của user
router.get("/search", getGroupsByName);
router.get("/:id", getGroupById); // lấy thông tin chi tiết group theo ID
router.post("/", upload.single("file"), createGroup);
router.put("/:id", upload.single("file"), updateGroup);
router.delete("/:id", deleteGroup);

/**
 * MEMBERS
 */
router.get("/:id/members", getGroupMembers);
router.get("/:id/members/search", getGroupsMemberByName);
router.post("/:id/members", addMember);
router.delete("/:id/members/:userId", deleteMember);

export default router;
