/**
 * @swagger
 * tags:
 *   name: Shopping List
 *   description: Shopping list management APIs
 */

// controllers/mealPlanController.js
import { supabase } from "../db.js";

const nameRegex = /^[a-zA-ZÀ-ỹ0-9 ]+$/;
const xssPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gim;

// Helper function to validate and format date
const validateAndFormatDate = (dateString) => {
  if (!dateString || typeof dateString !== "string") return null;

  const parts = dateString.split("-");
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
 * /meal:
 *   post:
 *     tags:
 *       - Meal Plans
 *     summary: Create a new meal plan
 *     description: Create a meal plan for a group. Only group admin can perform this action.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - name
 *               - description
 *               - timestamp
 *             properties:
 *               groupId:
 *                 type: integer
 *                 description: ID of the group
 *                 example: 1
 *               name:
 *                 type: string
 *                 enum: [breakfast, launch, dinner]
 *                 description: "Meal name: breakfast (sáng), lunch (trưa), dinner (tối)"
 *                 example: "breakfast"
 *               description:
 *                 type: string
 *                 description: Description of the meal plan
 *                 example: "Phở bò và bánh mì"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled time for the meal (must be in the future)
 *                 example: "2024-01-10T07:00:00.000Z"
 *           examples:
 *             breakfast:
 *               summary: Breakfast meal plan
 *               value:
 *                 groupId: 1
 *                 name: "breakfast"
 *                 description: "Phở bò và bánh mì"
 *                 timestamp: "2024-01-10T07:00:00.000Z"
 *             lunch:
 *               summary: Lunch meal plan
 *               value:
 *                 groupId: 1
 *                 name: "launch"
 *                 description: "Cơm gà xối mỡ"
 *                 timestamp: "2024-01-10T12:00:00.000Z"
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
 *                       example: "Meal plan added successfully"
 *                     vn:
 *                       type: string
 *                       example: "Thêm kế hoạch bữa ăn thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00322"
 *                 newPlan:
 *                   $ref: '#/components/schemas/MealPlan'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                 resultCode:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 value:
 *                   resultMessage:
 *                     en: "Please provide all required fields"
 *                     vn: "Vui lòng cung cấp tất cả các trường bắt buộc"
 *                   resultCode: "00313"
 *               invalidTimestamp:
 *                 value:
 *                   resultMessage:
 *                     en: "Please provide a valid timestamp"
 *                     vn: "Vui lòng cung cấp một dấu thời gian hợp lệ"
 *                   resultCode: "00315"
 *               invalidMealName:
 *                 value:
 *                   resultMessage:
 *                     en: "Please provide a valid meal name: breakfast (sáng), lunch (trưa), dinner (tối)"
 *                     vn: "Vui lòng cung cấp một tên hợp lệ cho bữa ăn, sáng, trưa, tối"
 *                   resultCode: "00316"
 *       403:
 *         description: Forbidden - Not group admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                 resultCode:
 *                   type: string
 *             example:
 *               resultMessage:
 *                 en: "Access denied. Only group admins can perform this action."
 *                 vn: "Truy cập không được ủy quyền, bạn không phải admin"
 *               resultCode: "00319"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */

export const createMealPlan = async (req, res) => {
  try {
    const { groupId, name, description, timestamp } = req.body;

    // 00313 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (!description || !timestamp || !name) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00313",
      });
    }

    // 00315 - Vui lòng cung cấp một dấu thời gian hợp lệ
    const formattedDate = validateAndFormatDate(timestamp);
    const now = Date.now();

    if (!formattedDate || new Date(timestamp).getTime() <= now) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid timestamp",
          vn: "Vui lòng cung cấp một dấu thời gian hợp lệ",
        },
        resultCode: "00315",
      });
    }

    // 00316 - Vui lòng cung cấp một tên hợp lệ cho bữa ăn, sáng, trưa, tối
    const validMealNames = ["breakfast", "launch", "dinner"];
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

    const { data: groupAdmin, error: groupError } = await supabase
      .from("groups")
      .select("id, created_by")
      .eq("id", groupId)
      .eq("created_by", req.user.id)
      .maybeSingle();

    if (groupError || !groupAdmin) {
      return res.status(403).json({
        resultMessage: {
          en: "Access denied. Only group admins can perform this action.",
          vn: "Truy cập không được ủy quyền, bạn không phải admin",
        },
        resultCode: "00319",
      });
    }

    // Chuẩn hóa tên bữa ăn
    let normalizedMealName = name.trim().toLowerCase();

    // Insert meal plan
    const { data: mealPlanData, error: insertError } = await supabase
      .from("mealplan")
      .insert([
        {
          name: normalizedMealName,
          description: description,
          timestamp: timestamp,
          status: "NOT_PASS_YET",
          groupid: groupId,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
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
        description: mealPlanData.description,
        timestamp: mealPlanData.timestamp,
        status: mealPlanData.status,
        updatedAt: mealPlanData.updatedat,
        createdAt: mealPlanData.createdat,
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
 * /meal:
 *   put:
 *     tags:
 *       - Meal Plans
 *     summary: Update an existing meal plan
 *     description: Update meal plan details. Only group admin can perform this action. At least one field must be provided for update.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - planId
 *             properties:
 *               groupId:
 *                 type: integer
 *                 description: ID of the group
 *                 example: 1
 *               planId:
 *                 type: integer
 *                 description: ID of the meal plan to update
 *                 example: 5
 *               newName:
 *                 type: string
 *                 enum: [breakfast, launch, dinner]
 *                 description: "New meal name: breakfast (sáng), lunch (trưa), dinner (tối)"
 *                 example: "lunch"
 *               newDescription:
 *                 type: string
 *                 description: New description for the meal plan
 *                 example: "Cơm gà xối mỡ và canh rau"
 *               newTimestamp:
 *                 type: string
 *                 format: date-time
 *                 description: New scheduled time (must be in the future)
 *                 example: "2024-01-15T12:00:00.000Z"
 *               newStatus:
 *                 type: string
 *                 enum: [NOT_PASS_YET, PASSED, SKIPPED]
 *                 description: New status of the meal plan
 *                 example: "PASSED"
 *           examples:
 *             updateNameAndTime:
 *               summary: Update name and timestamp
 *               value:
 *                 groupId: 1
 *                 planId: 5
 *                 newName: "dinner"
 *                 newTimestamp: "2024-01-15T19:00:00.000Z"
 *             updateDescription:
 *               summary: Update description only
 *               value:
 *                 groupId: 1
 *                 planId: 5
 *                 newDescription: "Lẩu Thái hải sản với tôm, mực, cá"
 *             updateStatus:
 *               summary: Update status
 *               value:
 *                 groupId: 1
 *                 planId: 5
 *                 newStatus: "PASSED"
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
 *                   example: "00344"
 *                 updatedPlan:
 *                   $ref: '#/components/schemas/MealPlanDetailed'
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 value:
 *                   resultMessage:
 *                     en: "Please provide all required fields"
 *                     vn: "Vui lòng cung cấp tất cả các trường bắt buộc"
 *                   resultCode: "00331"
 *               missingPlanId:
 *                 value:
 *                   resultMessage:
 *                     en: "Please provide a plan ID!"
 *                     vn: "Vui lòng cung cấp một ID kế hoạch!"
 *                   resultCode: "00332"
 *               noFieldsToUpdate:
 *                 value:
 *                   resultCode: "00333"
 *               invalidDescription:
 *                 value:
 *                   resultCode: "00334"
 *               invalidTimestamp:
 *                 value:
 *                   resultCode: "00335"
 *               invalidMealName:
 *                 value:
 *                   resultCode: "00336"
 *       403:
 *         description: Not group admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               resultCode: "00339"
 *       404:
 *         description: Plan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               resultCode: "00337"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */

export const updateMealPlan = async (req, res) => {
  try {
    const {
      groupId,
      planId,
      newName,
      newDescription,
      newTimestamp,
      newStatus,
    } = req.body;

    // 00331 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (
      !planId &&
      newDescription === undefined &&
      newTimestamp === undefined &&
      newName === undefined
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
      newDescription === undefined &&
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
    if (xssPattern.test(newDescription)) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid new description!",
          vn: "Vui lòng cung cấp một mô tả mới hợp lệ!",
        },
        resultCode: "00334",
      });
    }

    // 00335 - Vui lòng cung cấp một dấu thời gian hợp lệ!
    const formattedDate = validateAndFormatDate(newTimestamp);
    const now = Date.now();

    // Kiểm tra 1: Định dạng hợp lệ
    // Kiểm tra 2: Phải muộn hơn thời gian hiện tại
    if (!formattedDate || new Date(newTimestamp).getTime() <= now) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid newtimestamp",
          vn: "Vui lòng cung cấp một dấu thời gian mới hợp lệ",
        },
        resultCode: "00335",
      });
    }

    // 00336 - Vui lòng cung cấp một tên hợp lệ, sáng, trưa, tối!
    const validMealNames = ["breakfast", "launch", "dinner"];
    if (
      typeof newName !== "string" ||
      newName.trim() === "" ||
      !validMealNames.includes(newName.trim().toLowerCase())
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a new valid meal name: breakfast (sáng), lunch (trưa), dinner (tối)",
          vn: "Vui lòng cung cấp một tên mới hợp lệ cho bữa ăn, sáng, trưa, tối",
        },
        resultCode: "00336",
      });
    }

    // 00339 - Người dùng không phải là quản trị viên nhóm
    const { data: groupAdmin, error: groupError } = await supabase
      .from("groups")
      .select("id, created_by")
      .eq("id", groupId)
      .eq("created_by", req.user.id)
      .maybeSingle();

    if (groupError || !groupAdmin) {
      return res.status(403).json({
        resultMessage: {
          en: "Access denied. Only group admins can perform this action.",
          vn: "Truy cập không được ủy quyền, bạn không phải admin",
        },
        resultCode: "00339",
      });
    }

    // 00337 - Không tìm thấy kế hoạch với ID đã cung cấp
    const { data: existingPlan, error: fetchError } = await supabase
      .from("mealplan")
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

    // Build update object
    const updateData = { updatedat: new Date().toISOString() };

    // Xử lý newDescription
    if (newDescription !== undefined) {
      updateData.description = newDescription;
    }

    // Xử lý newName
    if (newName !== undefined) {
      let normalizedMealName = newName.trim().toLowerCase();
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
      .from("mealplan")
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
        description: updatedPlanData.description,
        timestamp: updatedPlanData.timestamp,
        status: updatedPlanData.status,
        groupid: updatedPlanData.groupid,
        updatedAt: updatedPlanData.updatedat,
        createdAt: updatedPlanData.createdat,
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
 * /api/mealplans:
 *   delete:
 *     tags:
 *       - Meal Plans
 *     summary: Delete a meal plan
 *     description: |
 *       Delete a meal plan and all associated data (shopping lists and tasks).
 *       Only group admin can perform this action.
 *
 *       **Cascade deletion:**
 *       1. Delete all tasks associated with shopping lists
 *       2. Delete all shopping lists associated with the meal plan
 *       3. Delete the meal plan itself
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - planId
 *             properties:
 *               groupId:
 *                 type: integer
 *                 description: ID of the group
 *                 example: 1
 *               planId:
 *                 type: integer
 *                 description: ID of the meal plan to delete
 *                 example: 5
 *           examples:
 *             deleteMealPlan:
 *               summary: Delete meal plan
 *               value:
 *                 groupId: 1
 *                 planId: 5
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
 *                       example: "Your meal plan was deleted successfully"
 *                     vn:
 *                       type: string
 *                       example: "Kế hoạch bữa ăn của bạn đã được xóa thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00330"
 *             example:
 *               resultMessage:
 *                 en: "Your meal plan was deleted successfully"
 *                 vn: "Kế hoạch bữa ăn của bạn đã được xóa thành công"
 *               resultCode: "00330"
 *       400:
 *         description: Bad request - Validation error
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
 *                     vn:
 *                       type: string
 *                 resultCode:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   resultMessage:
 *                     en: "Please provide all required fields"
 *                     vn: "Vui lòng cung cấp tất cả các trường bắt buộc"
 *                   resultCode: "00323"
 *               invalidPlanId:
 *                 summary: Invalid plan ID
 *                 value:
 *                   resultMessage:
 *                     en: "Please provide a valid plan ID"
 *                     vn: "Vui lòng cung cấp ID hợp lệ"
 *                   resultCode: "00324"
 *       403:
 *         description: Forbidden - Not group admin
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
 *                       example: "Access denied. Only group admins can perform this action."
 *                     vn:
 *                       type: string
 *                       example: "Truy cập không được ủy quyền, bạn không phải admin"
 *                 resultCode:
 *                   type: string
 *                   example: "00327"
 *             example:
 *               resultMessage:
 *                 en: "Access denied. Only group admins can perform this action."
 *                 vn: "Truy cập không được ủy quyền, bạn không phải admin"
 *               resultCode: "00327"
 *       404:
 *         description: Plan not found
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
 *                       example: "Plan not found with the provided ID"
 *                     vn:
 *                       type: string
 *                       example: "Không tìm thấy kế hoạch với ID đã cung cấp"
 *                 resultCode:
 *                   type: string
 *                   example: "00325"
 *             example:
 *               resultMessage:
 *                 en: "Plan not found with the provided ID"
 *                 vn: "Không tìm thấy kế hoạch với ID đã cung cấp"
 *               resultCode: "00325"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
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
 *                       example: "Internal server error"
 *                     vn:
 *                       type: string
 *                       example: "Lỗi máy chủ nội bộ"
 *                 resultCode:
 *                   type: string
 *                   example: "00500"
 *                 error:
 *                   type: string
 *                   example: "Error message details"
 *             example:
 *               resultMessage:
 *                 en: "Internal server error"
 *                 vn: "Lỗi máy chủ nội bộ"
 *               resultCode: "00500"
 *               error: "Database connection failed"
 */
export const deleteMealPlan = async (req, res) => {
  try {
    const { groupId, planId } = req.body;

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
    const numericPlanId = Number(planId);

    if (
      !Number.isInteger(numericPlanId) ||
      numericPlanId <= 0 ||
      (typeof planId === "string" && planId.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid plan ID",
          vn: "Vui lòng cung cấp ID hợp lệ",
        },
        resultCode: "00324",
      });
    }

    // 00327 - Người dùng không phải là quản trị viên nhóm
    const { data: groupAdmin, error: groupError } = await supabase
      .from("groups")
      .select("id, created_by")
      .eq("id", groupId)
      .eq("created_by", req.user.id)
      .maybeSingle();

    if (groupError || !groupAdmin) {
      return res.status(403).json({
        resultMessage: {
          en: "Access denied. Only group admins can perform this action.",
          vn: "Truy cập không được ủy quyền, bạn không phải admin",
        },
        resultCode: "00327",
      });
    }

    // 00325 - Không tìm thấy kế hoạch với ID đã cung cấp
    const { data: existingPlan, error: fetchError } = await supabase
      .from("mealplan")
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

    const { data: shoppingLists, error: fetchError1 } = await supabase
      .from("shoppinglist")
      .select("id")
      .eq("mealplan_id", planId);

    if (fetchError1) throw fetchError1;

    if (shoppingLists && shoppingLists.length > 0) {
      const shoppingListIds = shoppingLists.map((list) => list.id);

      // 2. Xóa tất cả TASK thuộc về các shoppinglist đó (Xóa Cháu)
      const { error: errorTask } = await supabase
        .from("task")
        .delete()
        .in("shoppinglist_id", shoppingListIds);

      if (errorTask) throw errorTask;
    }

    // 3. Xóa tất cả SHOPPINGLIST thuộc về mealplan này (Xóa Cha)
    const { error: errorShopping } = await supabase
      .from("shoppinglist")
      .delete()
      .eq("mealplan_id", planId);

    if (errorShopping) throw errorShopping;

    const { error: deleteError } = await supabase
      .from("mealplan")
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
 * /meal:
 *   post:
 *     summary: Get all meal plans of a group
 *     description: |
 *       Get all meal plans belonging to a specific group.
 *       User must be authenticated and must be a member of the group.
 *     tags:
 *       - MealPlan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *             properties:
 *               groupId:
 *                 type: string
 *                 example: "b1f23e9a-1234-4567-890a-abcdef123456"
 *     responses:
 *       200:
 *         description: Get meal plans successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00348"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Get plans successfully"
 *                     vn:
 *                       type: string
 *                       example: "Lấy danh sách thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1"
 *                       name:
 *                         type: string
 *                         example: "Weekly Meal Plan"
 *                       description:
 *                         type: string
 *                         example: "Meal plan for the whole week"
 *                       timestamp:
 *                         type: string
 *                         example: "2026-01-01T10:00:00Z"
 *                       status:
 *                         type: string
 *                         example: "active"
 *                       groupid:
 *                         type: string
 *                         example: "b1f23e9a-1234-4567-890a-abcdef123456"
 *                       createdAt:
 *                         type: string
 *                         example: "2026-01-01T09:00:00Z"
 *                       updatedAt:
 *                         type: string
 *                         example: "2026-01-02T09:00:00Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00401"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Unauthorized"
 *                     vn:
 *                       type: string
 *                       example: "Chưa xác thực"
 *       403:
 *         description: User is not a member of the group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00345"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "You have not joined any group"
 *                     vn:
 *                       type: string
 *                       example: "Bạn chưa vào nhóm nào"
 *       500:
 *         description: Internal Server Error
 */

export const getAllMealPlans = async (req, res) => {
  try {
    const { groupId } = req.body;

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
      .from("group_members")
      .select("group_id, user_id")
      .eq("user_id", req.user.id)
      .eq("group_id", groupId)
      .single();

    if (userError || !userData) {
      return res.status(403).json({
        resultMessage: {
          en: "You have not joined any group",
          vn: "Bạn chưa vào nhóm nào",
        },
        resultCode: "00345",
      });
    }

    // 2. Truy vấn Supabase dựa trên cấu trúc cột trong ảnh
    const { data: plans, error } = await supabase
      .from("mealplan")
      .select("*")
      .eq("groupid", groupId)
      .order("createdat", { ascending: true });

    if (error) throw error;

    if (!plans || plans.length === 0) {
      return res.status(200).json({
        resultCode: "00404",
        resultMessage: {
          en: "No meal plans found ",
          vn: "Không tìm thấy kế hoạch bữa ăn nào",
        },
        data: [],
      });
    }

    // Map lại data trả về cho chuẩn camelCase để Frontend dễ dùng
    const formattedPlans = plans.map((plan) => {
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        timestamp: plan.timestamp,
        status: plan.status,
        groupid: plan.groupid,
        createdAt: plan.createdat,
        updatedAt: plan.updatedat,
      };
    });

    return res.status(200).json({
      resultCode: "00200",
      resultMessage: {
        en: "Get plans successfully",
        vn: "Lấy danh sách thành công",
      },
      resultCode: "00348",
      data: formattedPlans,
    });
  } catch (error) {
    console.error("Error at getAllMealPlan:", error);
    return res.status(500).json({
      resultCode: "00500",
      resultMessage: {
        en: "Internal Server Error",
        vn: "Lỗi máy chủ nội bộ",
      },
      error: error.message,
    });
  }
};
