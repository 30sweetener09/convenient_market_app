// controllers/mealPlanController.js
import { supabase } from "../db.js";

// Helper function to validate and format date
const validateAndFormatDate = (dateString) => {
  if (!dateString || typeof dateString !== "string") return null;

  const parts = dateString.split("/");
  if (parts.length !== 3) return null;

  const [month, day, year] = parts;
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(monthNum) || isNaN(dayNum) || isNaN(yearNum)) return null;
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) return null;

  const daysInMonth = [
    31,
    yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (dayNum > daysInMonth[monthNum - 1]) return null;

  return `${yearNum}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

// Helper function to format date back to M/D/YYYY
const formatDateToDisplay = (dateString) => {
  if (!dateString) return null;

  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

/**
 * @swagger
 * /api/meal-plans/create:
 *   post:
 *     summary: Create a new meal plan
 *     description: Create a meal plan for a specific date and food item
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foodName
 *               - timestamp
 *               - name
 *             properties:
 *               foodName:
 *                 type: string
 *                 description: Name of the food item
 *                 example: "Cơm gà"
 *               timestamp:
 *                 type: string
 *                 description: Date in M/D/YYYY format
 *                 example: "11/15/2024"
 *               name:
 *                 type: string
 *                 description: Name of the meal plan
 *                 example: "Bữa trưa"
 *     responses:
 *       200:
 *         description: Meal plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Add meal plan successfull"
 *                     vn:
 *                       type: string
 *                       example: "Thêm kế hoạch bữa ăn thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00322"
 *                 newPlan:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       example: "11/15/2024"
 *                     status:
 *                       type: string
 *                       enum: [NOT_PASS_YET, PASSED, SKIPPED]
 *                     FoodId:
 *                       type: string
 *                     UserId:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing required fields or invalid date format
 *       404:
 *         description: Food not found
 *       500:
 *         description: Internal server error
 */
export const createMealPlan = async (req, res) => {
  try {
    const { foodName, timestamp, name } = req.body;

    // 00313 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (!foodName || !timestamp || !name) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00313",
      });
    }

    // 00314 - Vui lòng cung cấp một tên thực phẩm hợp lệ
    if (typeof foodName !== "string" || foodName.trim() === "") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid food name",
          vn: "Vui lòng cung cấp một tên thực phẩm hợp lệ",
        },
        resultCode: "00314",
      });
    }

    // 00315 - Vui lòng cung cấp một dấu thời gian hợp lệ
    const formattedDate = validateAndFormatDate(timestamp);
    if (!formattedDate) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid timestamp",
          vn: "Vui lòng cung cấp một dấu thời gian hợp lệ",
        },
        resultCode: "00315",
      });
    }

    // 00316 - Vui lòng cung cấp một tên hợp lệ cho bữa ăn, sáng, trưa, tối
    const validMealNames = ["sáng", "trưa", "tối", "sang", "trua", "toi"];
    if (
      typeof name !== "string" ||
      name.trim() === "" ||
      !validMealNames.includes(name.trim().toLowerCase())
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid meal name: breakfast (sáng), lunch (trưa), dinner (tối)",
          vn: "Vui lòng cung cấp một tên hợp lệ cho bữa ăn, sáng, trưa, tối",
        },
        resultCode: "00316",
      });
    }

    // 00319 - Người dùng không phải là quản trị viên nhóm
    if (!req.user || !req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00319",
      });
    }

    const { data: adminData, error: adminError } = await supabase
      .from("users")
      .select("id, role, group_id")
      .eq("id", req.user.id)
      .single();

    if (adminError || !adminData || adminData.role !== "admin") {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00319",
      });
    }

    // 00317 - Không tìm thấy thực phẩm với tên đã cung cấp
    const { data: food, error: foodError } = await supabase
      .from("foods")
      .select("id, name")
      .ilike("name", foodName.trim())
      .single();

    if (foodError || !food) {
      return res.status(404).json({
        resultMessage: {
          en: "Food not found with the provided name",
          vn: "Không tìm thấy thực phẩm với tên đã cung cấp",
        },
        resultCode: "00317",
      });
    }

    // Chuẩn hóa tên bữa ăn
    let normalizedMealName = name.trim().toLowerCase();
    if (normalizedMealName === "sang") normalizedMealName = "sáng";
    if (normalizedMealName === "trua") normalizedMealName = "trưa";
    if (normalizedMealName === "toi") normalizedMealName = "tối";

    // Insert meal plan
    const { data: mealPlanData, error: insertError } = await supabase
      .from("meal_plans")
      .insert([
        {
          name: normalizedMealName,
          timestamp: formattedDate,
          status: "NOT_PASS_YET",
          food_id: food.id,
          user_id: req.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // 00322 - Thêm kế hoạch bữa ăn thành công
    res.status(200).json({
      resultMessage: {
        en: "Meal plan added successfully",
        vn: "Thêm kế hoạch bữa ăn thành công",
      },
      resultCode: "00322",
      newPlan: {
        id: mealPlanData.id,
        name: mealPlanData.name,
        timestamp: mealPlanData.timestamp,
        status: mealPlanData.status,
        FoodId: mealPlanData.food_id,
        UserId: mealPlanData.user_id,
        updatedAt: mealPlanData.updated_at,
        createdAt: mealPlanData.created_at,
      },
    });
  } catch (err) {
    console.error("Error creating meal plan:", err.message);
    res.status(500).json({
      resultMessage: {
        en: "Internal server error",
        vn: "Lỗi máy chủ nội bộ",
      },
      resultCode: "00500",
      error: err.message,
    });
  }
};

/**
 * @swagger
 * /api/meal-plans/update:
 *   put:
 *     summary: Update an existing meal plan
 *     description: Update meal plan details including food, date, name, or status
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: ID of the meal plan to update
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               newName:
 *                 type: string
 *                 description: New name for the meal plan
 *                 example: "Bữa tối"
 *               newFoodName:
 *                 type: string
 *                 description: New food name to associate with the meal plan
 *                 example: "Phở bò"
 *               newTimestamp:
 *                 type: string
 *                 description: New date in M/D/YYYY format
 *                 example: "11/16/2024"
 *               newStatus:
 *                 type: string
 *                 enum: [NOT_PASS_YET, PASSED, SKIPPED]
 *                 description: New status for the meal plan
 *                 example: "PASSED"
 *     responses:
 *       200:
 *         description: Meal plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Meal plan updated successfully"
 *                     vn:
 *                       type: string
 *                       example: "Cập nhật kế hoạch bữa ăn thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00326"
 *                 updatedPlan:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       example: "11/16/2024"
 *                     status:
 *                       type: string
 *                     FoodId:
 *                       type: string
 *                     UserId:
 *                       type: string
 *       400:
 *         description: Missing planId, invalid data, or invalid status
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Meal plan or food not found
 *       500:
 *         description: Internal server error
 */
export const updateMealPlan = async (req, res) => {
  try {
    const { planId, newFoodName, newTimestamp, newName, newStatus } = req.body;

    // 00331 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (
      !planId &&
      newFoodName === undefined &&
      newTimestamp === undefined &&
      newName === undefined &&
      newStatus === undefined
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00331",
      });
    }

    // 00332 - Vui lòng cung cấp một ID kế hoạch!
    if (!planId || (typeof planId === "string" && planId.trim() === "")) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a plan ID!",
          vn: "Vui lòng cung cấp một ID kế hoạch!",
        },
        resultCode: "00332",
      });
    }

    // 00333 - Vui lòng cung cấp ít nhất một trong các trường sau
    if (
      newFoodName === undefined &&
      newTimestamp === undefined &&
      newName === undefined &&
      newStatus === undefined
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide at least one of the following fields: newFoodName, newTimestamp, newName",
          vn: "Vui lòng cung cấp ít nhất một trong các trường sau, newFoodName, newTimestamp, newName",
        },
        resultCode: "00333",
      });
    }

    // 00334 - Vui lòng cung cấp một tên thực phẩm mới hợp lệ!
    if (
      newFoodName !== undefined &&
      (typeof newFoodName !== "string" || newFoodName.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid new food name!",
          vn: "Vui lòng cung cấp một tên thực phẩm mới hợp lệ!",
        },
        resultCode: "00334",
      });
    }

    // 00335 - Vui lòng cung cấp một dấu thời gian hợp lệ!
    let formattedDate;
    if (newTimestamp !== undefined) {
      formattedDate = validateAndFormatDate(newTimestamp);
      if (!formattedDate) {
        return res.status(400).json({
          resultMessage: {
            en: "Please provide a valid timestamp!",
            vn: "Vui lòng cung cấp một dấu thời gian hợp lệ!",
          },
          resultCode: "00335",
        });
      }
    }

    // 00336 - Vui lòng cung cấp một tên hợp lệ, sáng, trưa, tối!
    const validMealNames = ["sáng", "trưa", "tối", "sang", "trua", "toi"];
    if (newName !== undefined) {
      if (
        typeof newName !== "string" ||
        newName.trim() === "" ||
        !validMealNames.includes(newName.trim().toLowerCase())
      ) {
        return res.status(400).json({
          resultMessage: {
            en: "Please provide a valid name: breakfast (sáng), lunch (trưa), dinner (tối)!",
            vn: "Vui lòng cung cấp một tên hợp lệ, sáng, trưa, tối!",
          },
          resultCode: "00336",
        });
      }
    }

    // 00339 - Người dùng không phải là quản trị viên nhóm
    if (!req.user || !req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00339",
      });
    }

    const { data: adminData, error: adminError } = await supabase
      .from("users")
      .select("id, role, group_id")
      .eq("id", req.user.id)
      .single();

    if (adminError || !adminData || adminData.role !== "admin") {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00339",
      });
    }

    // 00337 - Không tìm thấy kế hoạch với ID đã cung cấp
    const { data: existingPlan, error: fetchError } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (fetchError || !existingPlan) {
      return res.status(404).json({
        resultMessage: {
          en: "Plan not found with the provided ID",
          vn: "Không tìm thấy kế hoạch với ID đã cung cấp",
        },
        resultCode: "00337",
      });
    }

    // Kiểm tra meal plan có thuộc về user này không
    if (existingPlan.user_id !== req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00339",
      });
    }

    // Build update object
    const updateData = { updated_at: new Date().toISOString() };

    // Xử lý newFoodName
    if (newFoodName !== undefined) {
      // 00341 - Tên thực phẩm mới không tồn tại
      const { data: food, error: foodError } = await supabase
        .from("foods")
        .select("id, name")
        .ilike("name", newFoodName.trim())
        .single();

      if (foodError || !food) {
        return res.status(404).json({
          resultMessage: {
            en: "New food name does not exist",
            vn: "Tên thực phẩm mới không tồn tại",
          },
          resultCode: "00341",
        });
      }

      updateData.food_id = food.id;
    }

    // Xử lý newName
    if (newName !== undefined) {
      let normalizedMealName = newName.trim().toLowerCase();
      if (normalizedMealName === "sang") normalizedMealName = "sáng";
      if (normalizedMealName === "trua") normalizedMealName = "trưa";
      if (normalizedMealName === "toi") normalizedMealName = "tối";

      updateData.name = normalizedMealName;
    }

    // Xử lý newTimestamp
    if (newTimestamp !== undefined) {
      updateData.timestamp = formattedDate;
    }

    // Xử lý newStatus (nếu có)
    if (newStatus !== undefined) {
      const validStatuses = ["NOT_PASS_YET", "PASSED", "SKIPPED"];
      if (validStatuses.includes(newStatus)) {
        updateData.status = newStatus;
      }
    }

    // Update meal plan
    const { data: updatedPlanData, error: updateError } = await supabase
      .from("meal_plans")
      .update(updateData)
      .eq("id", planId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 00344 - Cập nhật kế hoạch bữa ăn thành công
    res.status(200).json({
      resultMessage: {
        en: "Meal plan updated successfully",
        vn: "Cập nhật kế hoạch bữa ăn thành công",
      },
      resultCode: "00344",
      updatedPlan: {
        id: updatedPlanData.id,
        name: updatedPlanData.name,
        timestamp: updatedPlanData.timestamp,
        status: updatedPlanData.status,
        FoodId: updatedPlanData.food_id,
        UserId: updatedPlanData.user_id,
        updatedAt: updatedPlanData.updated_at,
        createdAt: updatedPlanData.created_at,
      },
    });
  } catch (err) {
    console.error("Error updating meal plan:", err.message);
    res.status(500).json({
      resultMessage: {
        en: "Internal server error",
        vn: "Lỗi máy chủ nội bộ",
      },
      resultCode: "00500",
      error: err.message,
    });
  }
};
/**
 * @swagger
 * /api/meal-plans/delete:
 *   delete:
 *     summary: Delete a meal plan
 *     description: Delete a meal plan by its ID (user must own the plan)
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: ID of the meal plan to delete
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Meal plan deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Your meal plan was deleted successfully."
 *                     vn:
 *                       type: string
 *                       example: "Kế hoạch bữa ăn của bạn đã được xóa thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00330"
 *       400:
 *         description: Missing planId
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Meal plan not found
 *       500:
 *         description: Internal server error
 */
export const deleteMealPlan = async (req, res) => {
  try {
    const { planId } = req.body;

    // 00323 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (!planId) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00323",
      });
    }

    // 00324 - Vui lòng cung cấp một ID kế hoạch hợp lệ
    if (typeof planId !== "string" && typeof planId !== "number") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid plan ID",
          vn: "Vui lòng cung cấp một ID kế hoạch hợp lệ",
        },
        resultCode: "00324",
      });
    }

    if (typeof planId === "string" && planId.trim() === "") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid plan ID",
          vn: "Vui lòng cung cấp một ID kế hoạch hợp lệ",
        },
        resultCode: "00324",
      });
    }

    // 00327 - Người dùng không phải là quản trị viên nhóm
    if (!req.user || !req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00327",
      });
    }

    const { data: adminData, error: adminError } = await supabase
      .from("users")
      .select("id, role, group_id")
      .eq("id", req.user.id)
      .single();

    if (adminError || !adminData || adminData.role !== "admin") {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00327",
      });
    }

    // 00325 - Không tìm thấy kế hoạch với ID đã cung cấp
    const { data: existingPlan, error: fetchError } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (fetchError || !existingPlan) {
      return res.status(404).json({
        resultMessage: {
          en: "Plan not found with the provided ID",
          vn: "Không tìm thấy kế hoạch với ID đã cung cấp",
        },
        resultCode: "00325",
      });
    }

    // Kiểm tra meal plan có thuộc về user này không
    if (existingPlan.user_id !== req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00327",
      });
    }

    // Xóa meal plan
    const { error: deleteError } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", planId);

    if (deleteError) throw deleteError;

    // 00330 - Kế hoạch bữa ăn của bạn đã được xóa thành công
    res.status(200).json({
      resultMessage: {
        en: "Your meal plan was deleted successfully",
        vn: "Kế hoạch bữa ăn của bạn đã được xóa thành công",
      },
      resultCode: "00330",
    });
  } catch (err) {
    console.error("Error deleting meal plan:", err.message);
    res.status(500).json({
      resultMessage: {
        en: "Internal server error",
        vn: "Lỗi máy chủ nội bộ",
      },
      resultCode: "00500",
      error: err.message,
    });
  }
};

/**
 * @swagger
 * /api/meal-plans/get-by-date:
 *   get:
 *     summary: Get meal plans by date
 *     description: Retrieve all meal plans for the authenticated user on a specific date
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *         description: Date in M/D/YYYY format
 *         example: "11/15/2024"
 *     responses:
 *       200:
 *         description: Meal plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Get plans successfull"
 *                     vn:
 *                       type: string
 *                       example: "Lấy danh sách thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00348"
 *                 plans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         example: "11/15/2024"
 *                       status:
 *                         type: string
 *                         enum: [NOT_PASS_YET, PASSED, SKIPPED]
 *                       name:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       FoodId:
 *                         type: string
 *                       UserId:
 *                         type: string
 *                       Food:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                           type:
 *                             type: string
 *       400:
 *         description: Missing date parameter or invalid date format
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getMealPlansByDate = async (req, res) => {
  try {
    const { date } = req.query;

    // Kiểm tra authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        resultMessage: {
          en: "Unauthorized",
          vn: "Chưa xác thực",
        },
        resultCode: "00401",
      });
    }

    // 00345 - Bạn chưa vào nhóm nào
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, group_id")
      .eq("id", req.user.id)
      .single();

    if (userError || !userData || !userData.group_id) {
      return res.status(403).json({
        resultMessage: {
          en: "You have not joined any group",
          vn: "Bạn chưa vào nhóm nào",
        },
        resultCode: "00345",
      });
    }

    // Kiểm tra date parameter
    if (!date) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing date parameter",
          vn: "Thiếu tham số date",
        },
        resultCode: "00400",
      });
    }

    // Validate and format date
    const formattedDate = validateAndFormatDate(date);
    if (!formattedDate) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid date format. Expected MM/DD/YYYY",
          vn: "Định dạng ngày không hợp lệ. Yêu cầu MM/DD/YYYY",
        },
        resultCode: "00400",
      });
    }

    // Get meal plans for specific date with full food info
    const { data: plans, error } = await supabase
      .from("meal_plans")
      .select(
        `
        *,
        foods!meal_plans_food_id_fkey (
          id,
          name,
          image_url,
          imageUrl,
          type,
          created_at,
          updated_at,
          food_category_id,
          FoodCategoryId,
          user_id,
          UserId,
          unit_of_measurement_id,
          UnitOfMeasurementId
        )
      `
      )
      .eq("user_id", req.user.id)
      .eq("timestamp", formattedDate)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Format response data
    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      timestamp: plan.timestamp,
      status: plan.status,
      name: plan.name,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
      FoodId: plan.food_id,
      UserId: plan.user_id,
      Food: plan.foods
        ? {
            id: plan.foods.id,
            name: plan.foods.name,
            imageUrl: plan.foods.image_url || plan.foods.imageUrl,
            type: plan.foods.type,
            createdAt: plan.foods.created_at,
            updatedAt: plan.foods.updated_at,
            FoodCategoryId:
              plan.foods.food_category_id || plan.foods.FoodCategoryId,
            UserId: plan.foods.user_id || plan.foods.UserId,
            UnitOfMeasurementId:
              plan.foods.unit_of_measurement_id ||
              plan.foods.UnitOfMeasurementId,
          }
        : null,
    }));

    // 00348 - Lấy danh sách thành công
    res.status(200).json({
      resultMessage: {
        en: "Get plans successfully",
        vn: "Lấy danh sách thành công",
      },
      resultCode: "00348",
      plans: formattedPlans,
    });
  } catch (err) {
    console.error("Error getting meal plans by date:", err.message);
    res.status(500).json({
      resultMessage: {
        en: "Internal server error",
        vn: "Lỗi máy chủ nội bộ",
      },
      resultCode: "00500",
      error: err.message,
    });
  }
};
