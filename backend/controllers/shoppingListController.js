// controllers/shoppingListController.js
import { supabase } from "../db.js";

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate and format date from MM/DD/YYYY to YYYY-MM-DD
 * @param {string} dateString - Date in MM/DD/YYYY format
 * @returns {string|null} - Formatted date or null if invalid
 */
const nameRegex = /^[a-zA-ZÀ-ỹ0-9 ]+$/;
const xssPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gim;

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

// ==================== SHOPPING LIST CRUD ====================

/**
 * @swagger
 * /shopping:
 *   post:
 *     tags:
 *       - Shopping List
 *     summary: Create a new shopping list
 *     description: |
 *       Create a shopping list for a meal plan.
 *       Only group admin can perform this action.
 *       The assigned user must be a member of the group.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - mealplan_id
 *               - groupId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the shopping list
 *                 minLength: 1
 *                 example: "Danh sách mua sắm tuần 1"
 *               description:
 *                 type: string
 *                 description: Description of the shopping list (2-50 characters, alphanumeric and Vietnamese characters)
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Mua đồ cho bữa sáng"
 *               note:
 *                 type: string
 *                 description: Additional note (optional, max 500 characters)
 *                 maxLength: 500
 *                 nullable: true
 *                 example: "Nhớ mua rau tươi"
 *               mealplan_id:
 *                 type: integer
 *                 description: ID of the meal plan
 *                 example: 5
 *               groupId:
 *                 type: integer
 *                 description: ID of the group
 *                 example: 1
 *           examples:
 *             withNote:
 *               summary: Create shopping list with note
 *               value:
 *                 name: "Danh sách mua sắm tuần 1"
 *                 description: "Mua đồ cho bữa sáng"
 *                 note: "Nhớ mua rau tươi"
 *                 mealplan_id: 5
 *                 groupId: 1
 *             withoutNote:
 *               summary: Create shopping list without note
 *               value:
 *                 name: "Danh sách mua sắm cuối tuần"
 *                 description: "Mua đồ cho bữa trưa"
 *                 note: null
 *                 mealplan_id: 6
 *                 groupId: 1
 *     responses:
 *       200:
 *         description: Shopping list created successfully
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
 *                       example: "Shopping list created successfully."
 *                     vn:
 *                       type: string
 *                       example: "Danh sách mua sắm đã được tạo thành công."
 *                 resultCode:
 *                   type: string
 *                   example: "00249"
 *
 *             example:
 *               resultMessage:
 *                 en: "Shopping list created successfully."
 *                 vn: "Danh sách mua sắm đã được tạo thành công."
 *               resultCode: "00249"
 *               createdShoppingList:
 *                 id: 10
 *                 name: "Danh sách mua sắm tuần 1"
 *                 description: "Mua đồ cho bữa sáng"
 *                 note: "Nhớ mua rau tươi"
 *                 mealplan_id: 5
 *                 createdat: "2024-01-05T10:30:00.000Z"
 *                 updatedat: "2024-01-05T10:30:00.000Z"
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
 *               missingName:
 *                 summary: Missing or empty name
 *                 value:
 *                   resultMessage:
 *                     en: "Please provide name"
 *                     vn: "Vui lòng cung cấp tên danh sách mua sắm"
 *                   resultCode: "00239"
 *               missingDescription:
 *                 summary: Missing or empty description
 *                 value:
 *                   resultMessage:
 *                     en: "Please provide description"
 *                     vn: "Vui lòng cung cấp description"
 *                   resultCode: "00240"
 *               invalidDescriptionFormat:
 *                 summary: Invalid description format
 *                 value:
 *                   resultMessage:
 *                     vn: "Định dạng tên không hợp lệ"
 *                   resultCode: "00240x"
 *               invalidNote:
 *                 summary: Invalid note format
 *                 value:
 *                   resultMessage:
 *                     en: "Invalid note format"
 *                     vn: "Định dạng ghi chú không hợp lệ"
 *                   resultCode: "00241"
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
 *       403:
 *         description: Forbidden - Access denied
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
 *               notGroupAdmin:
 *                 summary: User is not group admin
 *                 value:
 *                   resultMessage:
 *                     en: "Access denied. Only group admins can perform this action."
 *                     vn: "Truy cập không được ủy quyền, bạn không phải admin"
 *                   resultCode: "00243"
 *               cannotAssignToUser:
 *                 summary: Cannot assign to user (not in group)
 *                 value:
 *                   resultMessage:
 *                     en: "Unauthorized access. You do not have permission to assign shopping list to this user."
 *                     vn: "Truy cập không được ủy quyền. Bạn không có quyền gán danh sách mua sắm cho người dùng này."
 *                   resultCode: "00246"
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
 */
export const createShoppingList = async (req, res) => {
  try {
    const { name, description, note, mealplan_id, groupId } = req.body;
    const userID = req.user.id;
    console.log(req.params);

    // Validate name
    if (!name.trim() || !name) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide name",
          vn: "Vui lòng cung cấp tên danh sách mua sắm",
        },
        resultCode: "00239",
      });
    }

    // Validate assignToUsername
    if (!description.trim() || !description) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide description",
          vn: "Vui lòng cung cấp description",
        },
        resultCode: "00240",
      });
    }

    if (
      !nameRegex.test(description) ||
      description.length < 2 ||
      description.length > 50
    ) {
      return res.status(400).json({
        resultCode: "00240x",
        resultMessage: { vn: "Định dạng tên không hợp lệ" },
      });
    }

    // Validate note format
    if (xssPattern.test(note) || note.length > 500) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid note format",
          vn: "Định dạng ghi chú không hợp lệ",
        },
        resultCode: "00241",
      });
    }

    // Check authentication

    /*const { data: groupAdmin, error: groupError } = await supabase
      .from("groups")
      .select("id, created_by")
      .eq("id", groupId)
      .eq("created_by", userID)
      .maybeSingle();

    if (groupError || !groupAdmin) {
      return res.status(403).json({
        resultMessage: {
          en: "Access denied. Only group admins can perform this action.",
          vn: "Truy cập không được ủy quyền, bạn không phải admin",
        },
        resultCode: "00243",
      });
    }*/

    /*// Check if assigned user exists
    const { data: assignedUser, error: assignedError } = await supabase
      .from("users")
      .select("id")
      .ilike("username", assignToUsername)
      .maybeSingle();

    if (assignedError || !assignedUser) {
      return res.status(404).json({
        resultMessage: {
          en: "Assigned username does not exist.",
          vn: "Tên người dùng được gán không tồn tại.",
        },
        resultCode: "00245",
      });
    }*/

    // Check permission to assign
    /*const { data: groupMember } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("user_id", assignedUser.id)
      .maybeSingle();

    if (!groupMember) {
      return res.status(403).json({
        resultMessage: {
          en: "Unauthorized access. You do not have permission to assign shopping list to this user.",
          vn: "Truy cập không được ủy quyền. Bạn không có quyền gán danh sách mua sắm cho người dùng này.",
        },
        resultCode: "00246",
      });
    }*/

    // Create shopping list
    const { data, error } = await supabase
      .from("shoppinglist")
      .insert([
        {
          name: name.trim(),
          description: description.trim(),
          note: note ? note.trim() : null,
          mealplan_id: mealplan_id,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      resultMessage: {
        en: "Shopping list created successfully.",
        vn: "Danh sách mua sắm đã được tạo thành công.",
      },
      resultCode: "00249",
      createdShoppingList: data,
    });
  } catch (err) {
    console.error("Error creating shopping list:", err.message);
    return res.status(500).json({
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
 * /shopping/getAll:
 *   post:
 *     tags:
 *       - Shopping List
 *     summary: Get all shopping lists for a meal plan
 *     description: |
 *       Retrieve all shopping lists associated with a specific meal plan.
 *       User must be authenticated.
 *       Lists are sorted by creation date (newest first).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mealplan_id
 *             properties:
 *               mealplan_id:
 *                 type: integer
 *                 description: ID of the meal plan
 *                 example: 5
 *           examples:
 *             getLists:
 *               summary: Get shopping lists for meal plan
 *               value:
 *                 mealplan_id: 5
 *     responses:
 *       200:
 *         description: Shopping lists retrieved successfully
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
 *                       example: "Get list of shopping lists successful"
 *                     vn:
 *                       type: string
 *                       example: "Lấy danh sách các shopping list thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00288"
 *                 data:
 *                   type: array
 *
 *             examples:
 *               withLists:
 *                 summary: Success with shopping lists
 *                 value:
 *                   resultMessage:
 *                     en: "Get list of shopping lists successful"
 *                     vn: "Lấy danh sách các shopping list thành công"
 *                   resultCode: "00288"
 *                   data:
 *                     - id: 10
 *                       name: "Danh sách mua sắm tuần 1"
 *                       description: "Mua đồ cho bữa sáng"
 *                       note: "Nhớ mua rau tươi"
 *                       mealplan_id: 5
 *                       createdat: "2024-01-05T10:30:00.000Z"
 *                       updatedat: "2024-01-05T10:30:00.000Z"
 *                     - id: 11
 *                       name: "Danh sách mua sắm tuần 2"
 *                       description: "Mua đồ cho bữa trưa"
 *                       note: null
 *                       mealplan_id: 5
 *                       createdat: "2024-01-04T08:00:00.000Z"
 *                       updatedat: "2024-01-04T08:00:00.000Z"
 *               emptyLists:
 *                 summary: No shopping lists found
 *                 value:
 *                   resultMessage:
 *                     en: "No shopping lists found"
 *                     vn: "Không tìm thấy danh sách mua sắm"
 *                   data: []
 *       400:
 *         description: Bad request - Missing mealplan_id
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
 *                       example: "Please provide mealplan_id"
 *                     vn:
 *                       type: string
 *                       example: "Vui lòng cung cấp mealplan_id"
 *                 resultCode:
 *                   type: string
 *                   example: "00400"
 *       401:
 *         description: Unauthorized - Authentication required
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
 *                       example: "Unauthorized"
 *                     vn:
 *                       type: string
 *                       example: "Chưa xác thực"
 *             example:
 *               resultMessage:
 *                 en: "Unauthorized"
 *                 vn: "Chưa xác thực"
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
 */
export const getAllShoppingLists = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { mealplan_id } = req.body;

    // Check authentication
    if (!userId) {
      return res.status(401).json({
        resultMessage: {
          en: "Unauthorized",
          vn: "Chưa xác thực",
        },
        resultCode: "00401",
      });
    }

    // Validate mealplan_id
    if (!mealplan_id) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide mealplan_id",
          vn: "Vui lòng cung cấp mealplan_id",
        },
        resultCode: "00400",
      });
    }

    // Get shopping lists
    const { data: lists, error: listError } = await supabase
      .from("shoppinglist")
      .select("*")
      .eq("mealplan_id", mealplan_id)
      .order("createdat", { ascending: false });

    if (listError) {
      console.error("List Error:", listError);
      throw listError;
    }

    // Handle empty results
    if (!lists || lists.length === 0) {
      return res.status(200).json({
        resultMessage: {
          en: "No shopping lists found",
          vn: "Không tìm thấy danh sách mua sắm",
        },
        resultCode: "00404",
        data: [],
      });
    }

    // Format response
    const result = lists.map((list) => ({
      id: list.id,
      name: list.name,
      description: list.description,
      note: list.note,
      mealplan_id: list.mealplan_id,
      createdat: list.createdat,
      updatedat: list.updatedat,
    }));

    return res.status(200).json({
      resultMessage: {
        en: "Get list of shopping lists successful",
        vn: "Lấy danh sách các shopping list thành công",
      },
      resultCode: "00288",
      data: result,
    });
  } catch (err) {
    console.error("Error getting shopping lists:", err);
    return res.status(500).json({
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
 * /shopping-list:
 *   put:
 *     summary: Cập nhật danh sách mua sắm
 *     tags: [Shopping List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listId]
 *             properties:
 *               listId:
 *                 type: integer
 *               newName:
 *                 type: string
 *               newAssignToUsername:
 *                 type: string
 *               newDate:
 *                 type: string
 *               newNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công (00266)
 *       400:
 *         description: Lỗi validation (00250-00256)
 *       403:
 *         description: Không có quyền (00258, 00261, 00263)
 *       404:
 *         description: Không tìm thấy (00260, 00262)
 *       500:
 *         description: Lỗi máy chủ (00500)
 */
export const updateShoppingList = async (req, res) => {
  try {
    const { groupId, shoppingId, name, description, note } = req.body;

    // Validate listId
    if (!shoppingId) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide current list id",
          vn: "Vui lòng cung cấp id danh sách hiện tại",
        },
        resultCode: "00251",
      });
    }

    // Validate at least one field to update
    if (!name?.trim() && !description?.trim() && !note?.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide at least one of the following fields: name, description, note",
          vn: "Vui lòng cung cấp ít nhất một trong những trường sau: name, description, note",
        },
        resultCode: "00252",
      });
    }

    // Validate newName
    if (!nameRegex.test(name) || name.length < 2 || name.length > 50) {
      return res.status(400).json({
        resultCode: "00253",
        resultMessage: {
          en: "Invalid new name format",
          vn: "Định dạng tên mới không hợp lệ",
        },
      });
    }

    // Validate newAssignToUsername
    if (
      !nameRegex.test(description) ||
      description.length < 2 ||
      description.length > 50
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid new description format",
          vn: "Định dạng description mới không hợp lệ",
        },
        resultCode: "00254",
      });
    }

    // Check if user is admin
    const { data: groupAdmin, error: groupError } = await supabase
      .from("groups")
      .select("id, created_by")
      .eq("id", groupId)
      .eq("created_by", req.user.id)
      .maybeSingle();

    if (groupError || !groupAdmin) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00258",
      });
    }

    // Check if shopping list exists
    const { data: existingList, error: fetchError } = await supabase
      .from("shoppinglist")
      .select("*")
      .eq("id", shoppingId)
      .maybeSingle();

    if (fetchError || !existingList) {
      return res.status(404).json({
        resultMessage: {
          en: "Shopping list not found",
          vn: "Không tìm thấy danh sách mua sắm",
        },
        resultCode: "00260",
      });
    }

    const updateData = { updatedat: new Date().toISOString() };

    // Update name
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // Update description
    if (description !== undefined) {
      updateData.description = description;
    }

    // Update note
    if (note !== undefined) {
      updateData.note = note ? note.trim() : null;
    }

    // Perform update
    const { data, error } = await supabase
      .from("shoppinglist")
      .update(updateData)
      .eq("id", shoppingId)
      .select()
      .maybeSingle();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Shopping list updated successfully",
        vn: "Cập nhật danh sách mua sắm thành công",
      },
      resultCode: "00266",
    });
  } catch (err) {
    console.error("Error updating shopping list:", err.message);
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
 * /shopping-list:
 *   delete:
 *     summary: Xóa danh sách mua sắm
 *     tags: [Shopping List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listId]
 *             properties:
 *               listId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công (00275)
 *       400:
 *         description: Thiếu listId (00268)
 *       403:
 *         description: Không có quyền (00270, 00273)
 *       404:
 *         description: Không tìm thấy (00272)
 *       500:
 *         description: Lỗi máy chủ (00500)
 */
export const deleteShoppingList = async (req, res) => {
  try {
    const { listName } = req.body;
    const groupId = req.params.groupId;

    // Validate listId
    if (!listName) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide list name",
          vn: "Vui lòng cung cấp tên danh sách",
        },
        resultCode: "00268",
      });
    }

    const { data: adminData, error: adminError } = await supabase
      .from("groups")
      .select("id, created_by")
      .eq("id", groupId)
      .eq("created_by", req.user.id)
      .maybeSingle();

    if (adminError || !adminData) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00270",
      });
    }

    // Check if shopping list exists
    const { data: existingList, error: fetchError } = await supabase
      .from("shoppinglist")
      .select("*")
      .eq("name", listName)
      .maybeSingle();

    if (fetchError || !existingList) {
      return res.status(404).json({
        resultMessage: {
          en: "Shopping list not found",
          vn: "Không tìm thấy danh sách mua sắm",
        },
        resultCode: "00272",
      });
    }

    // Check if user is the owner

    const { data: isAdmin, error: isAdminError } = await supabase
      .from("shoppinglist")
      .select("name, belongstogroupadminid, group_id")
      .eq("group_id", groupId)
      .eq("belongstogroupadminid", req.user.id)
      .eq("name", listName)
      .maybeSingle();

    if (isAdminError || !isAdmin) {
      return res.status(403).json({
        resultMessage: {
          en: "The user is not an administrator of this shopping list",
          vn: "Người dùng không phải là quản trị viên của danh sách mua sắm này",
        },
        resultCode: "00273",
      });
    }

    // Delete shopping list
    const { error: deleteError } = await supabase
      .from("shoppinglist")
      .delete()
      .eq("name", listName);

    if (deleteError) throw deleteError;

    res.status(200).json({
      resultMessage: {
        en: "Shopping list deleted successfully",
        vn: "Xóa danh sách mua sắm thành công",
      },
      resultCode: "00275",
    });
  } catch (err) {
    console.error("Error deleting shopping list:", err.message);
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
