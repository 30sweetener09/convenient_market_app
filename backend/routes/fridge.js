// routes/fridge.js
import express from "express";
import {
  createFridge,
  getAllFridge,
  getFridgeById,
  createFridgeItem,
  updateFridgeItem,
  deleteFridgeItem,
  getFridgeItems,
  getSpecificFridgeItem,
} from "../controllers/fridgeController.js";
import { requirePermission } from "../middlewares/permission.js";
import { userContext } from "../middlewares/userContext.js";

const router = express.Router();

router.use(userContext);

/**
 * --- QUẢN LÝ TỦ LẠNH (FRIDGE CONTAINER) ---
 */
// Lấy danh sách tủ lạnh của nhóm
router.get("/", getAllFridge);
// Tạo mới tủ lạnh
router.post("/", createFridge);
// Lấy chi tiết tủ lạnh theo ID
router.get("/:id", getFridgeById);
/**
 * --- QUẢN LÝ THỰC PHẨM TRONG TỦ (FRIDGE ITEMS) ---
 * Lưu ý: Các route này follow theo Swagger đã định nghĩa trong controller
 */
// Lấy danh sách thực phẩm (có thể filter theo groupId trong query)
router.get("/item/list", getFridgeItems);
// Tìm kiếm item cụ thể theo tên thực phẩm
router.get("/item/search/:foodName", getSpecificFridgeItem);
// Thêm thực phẩm vào tủ (Body: foodName, quantity, useWithinDays...)
router.post("/item/create", createFridgeItem);
// Cập nhật thực phẩm (Body: itemId, newQuantity...)
router.put("/item/update", updateFridgeItem);
// Xóa khỏi tủ (Body: foodName)
router.delete("/item/delete", deleteFridgeItem);

export default router;  