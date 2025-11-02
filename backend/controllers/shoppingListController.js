// controllers/shoppingListController.js
import { supabase } from "../db.js";

// Helper function to validate and format date (MM/DD/YYYY → YYYY-MM-DD)
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

/**
 * @swagger
 * /shopping-list/create:
 *   post:
 *     summary: Create a new shopping list
 *     tags: [Shopping List]
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
 *               - assignToUsername
 *               - date
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Shopping list for today"
 *               assignToUsername:
 *                 type: string
 *                 example: "member6320"
 *               note:
 *                 type: string
 *                 example: "nếu ngày ấy"
 *               date:
 *                 type: string
 *                 pattern: '^\d{2}/\d{2}/\d{4}$'
 *                 example: "12/30/2022"
 *                 description: Date in MM/DD/YYYY format
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
 *                     vn:
 *                       type: string
 *                 resultCode:
 *                   type: string
 *                 createdShoppingList:
 *                   type: object
 *       400:
 *         description: Bad request - Missing fields or invalid date format
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const createShoppingList = async (req, res) => {
  try {
    const { name, assignToUsername, note, date } = req.body;

    // 00238 - Vui cung cấp tất cả các trường cần thiết
    if (!name || !assignToUsername || !date) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui cung cấp tất cả các trường cần thiết",
        },
        resultCode: "00238",
      });
    }

    // 00239 - Vui lòng cung cấp tên
    if (!name || name.trim() === "") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide name",
          vn: "Vui lòng cung cấp tên",
        },
        resultCode: "00239",
      });
    }

    // 00240 - Vui lòng cung cấp assignToUsername
    if (!assignToUsername || assignToUsername.trim() === "") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide assignToUsername",
          vn: "Vui lòng cung cấp assignToUsername",
        },
        resultCode: "00240",
      });
    }

    // 00241 - Định dạng ghi chú không hợp lệ
    if (note && typeof note !== "string") {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid note format",
          vn: "Định dạng ghi chú không hợp lệ",
        },
        resultCode: "00241",
      });
    }

    // 00242 - Định dạng ngày không hợp lệ
    const formattedDate = validateAndFormatDate(date);
    if (!formattedDate) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid date format",
          vn: "Định dạng ngày không hợp lệ",
        },
        resultCode: "00242",
      });
    }

    // 00243 - Truy cập không được ủy quyền. Bạn không có quyền.
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        resultMessage: {
          en: "Unauthorized access. You do not have permission.",
          vn: "Truy cập không được ủy quyền. Bạn không có quyền.",
        },
        resultCode: "00243",
      });
    }

    // 00245 - Tên người dùng được gán không tồn tại.
    const { data: assignedUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", assignToUsername)
      .single();

    if (userError || !assignedUser) {
      return res.status(404).json({
        resultMessage: {
          en: "Assigned username does not exist.",
          vn: "Tên người dùng được gán không tồn tại.",
        },
        resultCode: "00245",
      });
    }

    // 00246 - Truy cập không được ủy quyền. Bạn không có quyền gán danh sách mua sắm cho người dùng này.
    // Kiểm tra quyền gán danh sách cho user (có thể thêm logic kiểm tra relationship giữa admin và user)
    const { data: userRelation, error: relationError } = await supabase
      .from("users")
      .select("id, group_id")
      .eq("id", assignedUser.id)
      .single();

    const { data: adminData, error: adminError } = await supabase
      .from("users")
      .select("id, group_id, role")
      .eq("id", req.user.id)
      .single();

    if (
      adminData &&
      userRelation &&
      adminData.group_id !== userRelation.group_id
    ) {
      return res.status(403).json({
        resultMessage: {
          en: "Unauthorized access. You do not have permission to assign shopping list to this user.",
          vn: "Truy cập không được ủy quyền. Bạn không có quyền gán danh sách mua sắm cho người dùng này.",
        },
        resultCode: "00246",
      });
    }

    // Tạo shopping list
    const { data, error } = await supabase
      .from("shopping_list")
      .insert([
        {
          name: name.trim(),
          note: note ? note.trim() : null,
          assign_to_username: assignToUsername,
          assigned_to_user_id: assignedUser.id,
          date: formattedDate,
          belongs_to_admin_id: req.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // 00249 - Danh sách mua sắm đã được tạo thành công.
    res.status(200).json({
      resultMessage: {
        en: "Shopping list created successfully.",
        vn: "Danh sách mua sắm đã được tạo thành công.",
      },
      resultCode: "00249",
      createdShoppingList: {
        id: data.id,
        name: data.name,
        note: data.note,
        belongsToGroupAdminId: data.belongs_to_admin_id,
        assignedToUserId: data.assigned_to_user_id,
        assignToUsername: data.assign_to_username,
        date: data.date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        UserId: data.belongs_to_admin_id,
      },
    });
  } catch (err) {
    console.error("Error creating shopping list:", err.message);
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
 * /shopping-list/update:
 *   put:
 *     summary: Update an existing shopping list
 *     tags: [Shopping List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listId
 *             properties:
 *               listId:
 *                 type: integer
 *                 example: 1
 *               newName:
 *                 type: string
 *                 example: "Monthly Groceries"
 *               newAssignToUsername:
 *                 type: string
 *                 example: "jane_doe"
 *               newDate:
 *                 type: string
 *                 pattern: '^\d{2}/\d{2}/\d{4}$'
 *                 example: "01/15/2025"
 *               newNote:
 *                 type: string
 *                 example: "Updated note"
 *     responses:
 *       200:
 *         description: Shopping list updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Shopping list or user not found
 */
export const updateShoppingList = async (req, res) => {
  try {
    const { listId, newName, newAssignToUsername, newDate, newNote } = req.body;

    // 00250 - Vui cung cấp tất cả các trường cần thiết
    if (
      !listId &&
      !newName &&
      !newAssignToUsername &&
      !newDate &&
      newNote === undefined
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui cung cấp tất cả các trường cần thiết",
        },
        resultCode: "00250",
      });
    }

    // 00251 - Vui lòng cung cấp id danh sách
    if (!listId) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide list id",
          vn: "Vui lòng cung cấp id danh sách",
        },
        resultCode: "00251",
      });
    }

    // 00252 - Vui lòng cung cấp ít nhất một trong những trường sau
    if (
      newName === undefined &&
      newAssignToUsername === undefined &&
      newDate === undefined &&
      newNote === undefined
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide at least one of the following fields: newName, newAssignToUsername, newNote, newDate",
          vn: "Vui lòng cung cấp ít nhất một trong những trường sau, newName, newAssignToUsername, newNote, newDate",
        },
        resultCode: "00252",
      });
    }

    // 00253 - Định dạng tên mới không hợp lệ
    if (
      newName !== undefined &&
      (typeof newName !== "string" || newName.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid new name format",
          vn: "Định dạng tên mới không hợp lệ",
        },
        resultCode: "00253",
      });
    }

    // 00254 - Định dạng tên người được giao mới không hợp lệ
    if (
      newAssignToUsername !== undefined &&
      (typeof newAssignToUsername !== "string" ||
        newAssignToUsername.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid new assignee username format",
          vn: "Định dạng tên người được giao mới không hợp lệ",
        },
        resultCode: "00254",
      });
    }

    // 00255 - Định dạng ghi chú mới không hợp lệ
    if (
      newNote !== undefined &&
      newNote !== null &&
      typeof newNote !== "string"
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid new note format",
          vn: "Định dạng ghi chú mới không hợp lệ",
        },
        resultCode: "00255",
      });
    }

    // 00256 - Định dạng ngày mới không hợp lệ
    let formattedDate;
    if (newDate !== undefined) {
      formattedDate = validateAndFormatDate(newDate);
      if (!formattedDate) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid new date format",
            vn: "Định dạng ngày mới không hợp lệ",
          },
          resultCode: "00256",
        });
      }
    }

    // 00258 - Người dùng không phải là quản trị viên nhóm
    if (!req.user || !req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00258",
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
        resultCode: "00258",
      });
    }

    // 00260 - Không tìm thấy danh sách mua sắm
    const { data: existingList, error: fetchError } = await supabase
      .from("shopping_list")
      .select("*")
      .eq("id", listId)
      .single();

    if (fetchError || !existingList) {
      return res.status(404).json({
        resultMessage: {
          en: "Shopping list not found",
          vn: "Không tìm thấy danh sách mua sắm",
        },
        resultCode: "00260",
      });
    }

    // 00261 - Người dùng không phải là quản trị viên của danh sách mua sắm này
    if (existingList.belongs_to_admin_id !== req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not the admin of this shopping list",
          vn: "Người dùng không phải là quản trị viên của danh sách mua sắm này",
        },
        resultCode: "00261",
      });
    }

    const updateData = { updated_at: new Date().toISOString() };

    // Xử lý newName
    if (newName !== undefined) {
      updateData.name = newName.trim();
    }

    // Xử lý newAssignToUsername
    if (newAssignToUsername !== undefined) {
      // 00262 - Người dùng không tồn tại
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .select("id, group_id")
        .eq("username", newAssignToUsername)
        .single();

      if (userError || !newUser) {
        return res.status(404).json({
          resultMessage: {
            en: "User does not exist",
            vn: "Người dùng không tồn tại",
          },
          resultCode: "00262",
        });
      }

      // 00263 - Người dùng không có quyền gán danh sách này cho tên người dùng
      if (adminData.group_id !== newUser.group_id) {
        return res.status(403).json({
          resultMessage: {
            en: "User does not have permission to assign this list to the username",
            vn: "Người dùng không có quyền gán danh sách này cho tên người dùng",
          },
          resultCode: "00263",
        });
      }

      updateData.assign_to_username = newAssignToUsername;
      updateData.assigned_to_user_id = newUser.id;
    }

    // Xử lý newNote
    if (newNote !== undefined) {
      updateData.note = newNote ? newNote.trim() : null;
    }

    // Xử lý newDate
    if (newDate !== undefined) {
      updateData.date = formattedDate;
    }

    // Thực hiện update
    const { data, error } = await supabase
      .from("shopping_list")
      .update(updateData)
      .eq("id", listId)
      .select()
      .single();

    if (error) throw error;

    // 00266 - Cập nhật danh sách mua sắm thành công
    res.status(200).json({
      resultMessage: {
        en: "Shopping list updated successfully",
        vn: "Cập nhật danh sách mua sắm thành công",
      },
      resultCode: "00266",
      newShoppingList: {
        id: data.id,
        name: data.name,
        note: data.note,
        belongsToGroupAdminId: data.belongs_to_admin_id,
        assignedToUserId: data.assigned_to_user_id,
        assignToUsername: data.assign_to_username,
        date: data.date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        UserId: data.belongs_to_admin_id,
      },
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
 * /shopping-list/delete:
 *   delete:
 *     summary: Delete a shopping list
 *     tags: [Shopping List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listId
 *             properties:
 *               listId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Shopping list deleted successfully
 *       400:
 *         description: Missing listId
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Shopping list not found
 */
export const deleteShoppingList = async (req, res) => {
  try {
    const { listId } = req.body;

    // 00267 - Cung cấp các trường cần thiết
    if (!listId) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide required fields",
          vn: "Cung cấp các trường cần thiết",
        },
        resultCode: "00267",
      });
    }

    // 00268 - Vui lòng cung cấp id danh sách
    if (!listId || listId.trim() === "") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide list id",
          vn: "Vui lòng cung cấp id danh sách",
        },
        resultCode: "00268",
      });
    }

    // 00270 - Người dùng không phải là quản trị viên nhóm
    if (!req.user || !req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00270",
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
        resultCode: "00270",
      });
    }

    // 00272 - Không tìm thấy danh sách mua sắm
    const { data: existingList, error: fetchError } = await supabase
      .from("shopping_list")
      .select("*")
      .eq("id", listId)
      .single();

    if (fetchError || !existingList) {
      return res.status(404).json({
        resultMessage: {
          en: "Shopping list not found",
          vn: "Không tìm thấy danh sách mua sắm",
        },
        resultCode: "00272",
      });
    }

    // 00273 - Người dùng không phải là quản trị viên của danh sách mua sắm này
    if (existingList.belongs_to_admin_id !== req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not the admin of this shopping list",
          vn: "Người dùng không phải là quản trị viên của danh sách mua sắm này",
        },
        resultCode: "00273",
      });
    }

    // Xóa danh sách mua sắm
    const { error: deleteError } = await supabase
      .from("shopping_list")
      .delete()
      .eq("id", listId);

    if (deleteError) throw deleteError;

    // 00275 - Xóa danh sách mua sắm thành công
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

/**
 * @swagger
 * /shopping-list/tasks/create:
 *   post:
 *     summary: Create tasks for a shopping list
 *     tags: [Shopping List Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listId
 *               - tasks
 *             properties:
 *               listId:
 *                 type: integer
 *                 example: 1
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - foodName
 *                     - quantity
 *                   properties:
 *                     foodName:
 *                       type: string
 *                       example: "Tomatoes"
 *                     quantity:
 *                       type: string
 *                       example: "2 kg"
 *     responses:
 *       200:
 *         description: Tasks created successfully
 *       400:
 *         description: Bad request - Invalid input
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Shopping list not found
 */
export const createTasks = async (req, res) => {
  try {
    const { listId, tasks } = req.body;

    // 00276 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (!listId || !tasks) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00276",
      });
    }

    // 00277 - Vui lòng cung cấp một ID của danh sách
    if (!listId || (typeof listId === "string" && listId.trim() === "")) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a list ID",
          vn: "Vui lòng cung cấp một ID của danh sách",
        },
        resultCode: "00277",
      });
    }

    // 00278 - Vui lòng cung cấp một mảng nhiệm vụ
    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a tasks array",
          vn: "Vui lòng cung cấp một mảng nhiệm vụ",
        },
        resultCode: "00278",
      });
    }

    if (tasks.length === 0) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a tasks array",
          vn: "Vui lòng cung cấp một mảng nhiệm vụ",
        },
        resultCode: "00278",
      });
    }

    // 00279 - Vui lòng cung cấp một mảng nhiệm vụ với các trường hợp lệ
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      // Kiểm tra task phải là object
      if (typeof task !== "object" || task === null) {
        return res.status(400).json({
          resultMessage: {
            en: "Please provide a tasks array with valid fields",
            vn: "Vui lòng cung cấp một mảng nhiệm vụ với các trường hợp lệ",
          },
          resultCode: "00279",
        });
      }

      // Kiểm tra foodName
      if (
        !task.foodName ||
        typeof task.foodName !== "string" ||
        task.foodName.trim() === ""
      ) {
        return res.status(400).json({
          resultMessage: {
            en: "Please provide a tasks array with valid fields",
            vn: "Vui lòng cung cấp một mảng nhiệm vụ với các trường hợp lệ",
          },
          resultCode: "00279",
        });
      }

      // Kiểm tra quantity
      if (
        !task.quantity ||
        typeof task.quantity !== "string" ||
        task.quantity.trim() === ""
      ) {
        return res.status(400).json({
          resultMessage: {
            en: "Please provide a tasks array with valid fields",
            vn: "Vui lòng cung cấp một mảng nhiệm vụ với các trường hợp lệ",
          },
          resultCode: "00279",
        });
      }
    }

    // 00281 - Người dùng không phải là quản trị viên của nhóm
    if (!req.user || !req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên của nhóm",
        },
        resultCode: "00281",
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
          vn: "Người dùng không phải là quản trị viên của nhóm",
        },
        resultCode: "00281",
      });
    }

    // 00283 - Không tìm thấy danh sách mua sắm
    const { data: existingList, error: fetchError } = await supabase
      .from("shopping_list")
      .select("id, belongs_to_admin_id")
      .eq("id", listId)
      .single();

    if (fetchError || !existingList) {
      return res.status(404).json({
        resultMessage: {
          en: "Shopping list not found",
          vn: "Không tìm thấy danh sách mua sắm",
        },
        resultCode: "00283",
      });
    }

    // 00284 - Người dùng không phải là quản trị viên của danh sách mua sắm này
    if (existingList.belongs_to_admin_id !== req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not the admin of this shopping list",
          vn: "Người dùng không phải là quản trị viên của danh sách mua sắm này",
        },
        resultCode: "00284",
      });
    }

    // Kiểm tra food_name có tồn tại trong bảng foods
    const foodNames = tasks.map((task) => task.foodName.trim().toLowerCase());
    const { data: foodsData, error: foodsError } = await supabase
      .from("foods")
      .select("name")
      .in("name", foodNames);

    if (foodsError) throw foodsError;

    // 00285 - Không tìm thấy một món ăn với tên cung cấp trong mảng
    const existingFoodNames = foodsData.map((food) => food.name.toLowerCase());
    const missingFoods = foodNames.filter(
      (name) => !existingFoodNames.includes(name)
    );

    if (missingFoods.length > 0) {
      return res.status(404).json({
        resultMessage: {
          en: "Food item not found with the provided name in the array",
          vn: "Không tìm thấy một món ăn với tên cung cấp trong mảng",
        },
        resultCode: "00285",
        missingFoods: missingFoods,
      });
    }

    // Kiểm tra xem food đã tồn tại trong shopping list chưa
    const { data: existingTasks, error: existingTasksError } = await supabase
      .from("shopping_list_tasks")
      .select("food_name")
      .eq("shopping_list_id", listId);

    if (existingTasksError) throw existingTasksError;

    const existingTaskNames = existingTasks.map((task) =>
      task.food_name.toLowerCase()
    );
    const duplicateFoods = foodNames.filter((name) =>
      existingTaskNames.includes(name)
    );

    // 00286 - Loại thức ăn này đã có trong danh sách rồi
    if (duplicateFoods.length > 0) {
      return res.status(400).json({
        resultMessage: {
          en: "This food type already exists in the list",
          vn: "Loại thức ăn này đã có trong danh sách rồi",
        },
        resultCode: "00286",
        duplicateFoods: duplicateFoods,
      });
    }

    // Tạo tasks data
    const taskData = tasks.map((task) => ({
      shopping_list_id: listId,
      food_name: task.foodName.trim(),
      quantity: task.quantity.trim(),
      is_done: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert tasks
    const { data: insertedTasks, error: insertError } = await supabase
      .from("shopping_list_tasks")
      .insert(taskData)
      .select();

    if (insertError) throw insertError;

    // 00287 - Thêm nhiệm vụ thành công
    res.status(200).json({
      resultMessage: {
        en: "Tasks added successfully",
        vn: "Thêm nhiệm vụ thành công",
      },
      resultCode: "00287",
      addedTasks: insertedTasks.map((task) => ({
        id: task.id,
        shoppingListId: task.shopping_list_id,
        foodName: task.food_name,
        quantity: task.quantity,
        isDone: task.is_done,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      })),
    });
  } catch (err) {
    console.error("Error creating tasks:", err.message);
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
 * /shopping-list/tasks/list:
 *   get:
 *     summary: Get list of shopping lists with tasks
 *     tags: [Shopping List Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved shopping lists and tasks
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
 *                 role:
 *                   type: string
 *                 list:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
export const getListOfTasks = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        resultMessage: {
          en: "This user does not belong to any groups",
          vn: "Người dùng này chưa thuộc nhóm nào",
        },
        resultCode: "00288",
      });
    }

    const { data: lists, error } = await supabase
      .from("shopping_list")
      .select(
        `
        *,
        users!shopping_list_assigned_to_user_id_fkey (username)
      `
      )
      .eq("belongs_to_admin_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const listWithTasks = await Promise.all(
      lists.map(async (list) => {
        const { data: tasks } = await supabase
          .from("shopping_list_tasks")
          .select("*")
          .eq("shopping_list_id", list.id)
          .order("created_at", { ascending: true });

        return {
          id: list.id,
          name: list.name,
          note: list.note,
          belongsToGroupAdminId: list.belongs_to_admin_id,
          assignedToUserId: list.assigned_to_user_id,
          assignToUsername: list.assign_to_username,
          date: list.date,
          createdAt: list.created_at,
          updatedAt: list.updated_at,
          UserId: list.belongs_to_admin_id,
          username: list.users?.username || null,
          details: (tasks || []).map((task) => ({
            id: task.id,
            foodName: task.food_name,
            quantity: task.quantity,
            isDone: task.is_done,
            createdAt: task.created_at,
            updatedAt: task.updated_at,
          })),
        };
      })
    );

    res.status(200).json({
      resultMessage: {
        en: "Get list of shopping lists and tasks successful",
        vn: "Lấy danh sách các shopping list thành công",
      },
      resultCode: "00292",
      role: "admin",
      list: listWithTasks,
    });
  } catch (err) {
    console.error("Error getting shopping lists:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

/**
 * @swagger
 * /shopping-list/tasks/mark:
 *   put:
 *     summary: Mark/unmark a task as done
 *     tags: [Shopping List Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *             properties:
 *               taskId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Task marked successfully
 *       400:
 *         description: Missing taskId
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Task not found
 */
export const markTask = async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing taskId",
          vn: "Thiếu taskId",
        },
        resultCode: "400",
      });
    }

    const { data: task, error: fetchError } = await supabase
      .from("shopping_list_tasks")
      .select("*, shopping_list!inner(belongs_to_admin_id)")
      .eq("id", taskId)
      .single();

    if (fetchError || !task) {
      return res.status(404).json({
        resultMessage: {
          en: "Task not found",
          vn: "Không tìm thấy task",
        },
        resultCode: "404",
      });
    }

    if (task.shopping_list.belongs_to_admin_id !== req.user?.id) {
      return res.status(403).json({
        resultMessage: {
          en: "Permission denied",
          vn: "Không có quyền",
        },
        resultCode: "403",
      });
    }

    const { error } = await supabase
      .from("shopping_list_tasks")
      .update({
        is_done: !task.is_done,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Task marked successfully",
        vn: "Đánh dấu task thành công",
      },
      resultCode: "00295",
      newStatus: !task.is_done,
    });
  } catch (err) {
    console.error("Error marking task:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

/**
 * @swagger
 * /shopping-list/tasks/delete:
 *   delete:
 *     summary: Delete a task
 *     tags: [Shopping List Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *             properties:
 *               taskId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       400:
 *         description: Missing taskId
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Task not found
 */
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.body;

    // 00293 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (!taskId) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00293",
      });
    }

    // 00294 - Vui lòng cung cấp một ID nhiệm vụ trong trường taskId
    if (typeof taskId !== "string" && typeof taskId !== "number") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a task ID in the taskId field",
          vn: "Vui lòng cung cấp một ID nhiệm vụ trong trường taskId",
        },
        resultCode: "00294",
      });
    }

    if (typeof taskId === "string" && taskId.trim() === "") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a task ID in the taskId field",
          vn: "Vui lòng cung cấp một ID nhiệm vụ trong trường taskId",
        },
        resultCode: "00294",
      });
    }

    // 00297 - Người dùng không phải là quản trị viên nhóm
    if (!req.user || !req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00297",
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
        resultCode: "00297",
      });
    }

    // 00296 - Không tìm thấy nhiệm vụ với ID đã cung cấp
    const { data: existingTask, error: fetchError } = await supabase
      .from("shopping_list_tasks")
      .select(
        `
        *,
        shopping_list:shopping_list_id (
          id,
          belongs_to_admin_id
        )
      `
      )
      .eq("id", taskId)
      .single();

    if (fetchError || !existingTask) {
      return res.status(404).json({
        resultMessage: {
          en: "Task not found with the provided ID",
          vn: "Không tìm thấy nhiệm vụ với ID đã cung cấp",
        },
        resultCode: "00296",
      });
    }

    // Kiểm tra user có phải là admin của shopping list này không
    if (existingTask.shopping_list?.belongs_to_admin_id !== req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00297",
      });
    }

    // Xóa task
    const { error: deleteError } = await supabase
      .from("shopping_list_tasks")
      .delete()
      .eq("id", taskId);

    if (deleteError) throw deleteError;

    // 00299 - Xóa nhiệm vụ thành công
    res.status(200).json({
      resultMessage: {
        en: "Task deleted successfully",
        vn: "Xóa nhiệm vụ thành công",
      },
      resultCode: "00299",
    });
  } catch (err) {
    console.error("Error deleting task:", err.message);
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
 * /shopping-list/tasks/update:
 *   put:
 *     summary: Update a task
 *     tags: [Shopping List Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *             properties:
 *               taskId:
 *                 type: integer
 *                 example: 1
 *               newFoodName:
 *                 type: string
 *                 example: "Fresh Tomatoes"
 *               newQuantity:
 *                 type: string
 *                 example: "3 kg"
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Task not found
 */
export const updateTask = async (req, res) => {
  try {
    const { taskId, newFoodName, newQuantity } = req.body;

    // 00300 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (!taskId && newFoodName === undefined && newQuantity === undefined) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00300",
      });
    }

    // 00301 - Vui lòng cung cấp một ID nhiệm vụ trong trường taskId
    if (!taskId || (typeof taskId === "string" && taskId.trim() === "")) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a task ID in the taskId field",
          vn: "Vui lòng cung cấp một ID nhiệm vụ trong trường taskId",
        },
        resultCode: "00301",
      });
    }

    // 00302 - Vui lòng cung cấp ít nhất một trong các trường sau
    if (newFoodName === undefined && newQuantity === undefined) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide at least one of the following fields: newFoodName, newQuantity",
          vn: "Vui lòng cung cấp ít nhất một trong các trường sau, newFoodName, newQuantity",
        },
        resultCode: "00302",
      });
    }

    // 00303 - Vui lòng cung cấp một newFoodName hợp lệ
    if (
      newFoodName !== undefined &&
      (typeof newFoodName !== "string" || newFoodName.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid newFoodName",
          vn: "Vui lòng cung cấp một newFoodName hợp lệ",
        },
        resultCode: "00303",
      });
    }

    // 00304 - Vui lòng cung cấp một newQuantity hợp lệ
    if (
      newQuantity !== undefined &&
      (typeof newQuantity !== "string" || newQuantity.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid newQuantity",
          vn: "Vui lòng cung cấp một newQuantity hợp lệ",
        },
        resultCode: "00304",
      });
    }

    // 00307 - Người dùng không phải là quản trị viên nhóm
    if (!req.user || !req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00307",
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
        resultCode: "00307",
      });
    }

    // 00306 - Không tìm thấy nhiệm vụ với ID đã cung cấp
    const { data: task, error: fetchError } = await supabase
      .from("shopping_list_tasks")
      .select(
        `
        *,
        shopping_list:shopping_list_id (
          id,
          belongs_to_admin_id
        )
      `
      )
      .eq("id", taskId)
      .single();

    if (fetchError || !task) {
      return res.status(404).json({
        resultMessage: {
          en: "Task not found with the provided ID",
          vn: "Không tìm thấy nhiệm vụ với ID đã cung cấp",
        },
        resultCode: "00306",
      });
    }

    // Kiểm tra quyền admin của shopping list
    if (task.shopping_list?.belongs_to_admin_id !== req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00307",
      });
    }

    // Nếu có newFoodName, kiểm tra xem food có tồn tại trong bảng foods không
    if (newFoodName !== undefined) {
      // 00308 - Không tìm thấy nhiệm vụ với tên đã cung cấp
      const { data: foodData, error: foodError } = await supabase
        .from("foods")
        .select("name")
        .ilike("name", newFoodName.trim())
        .single();

      if (foodError || !foodData) {
        return res.status(404).json({
          resultMessage: {
            en: "Food not found with the provided name",
            vn: "Không tìm thấy nhiệm vụ với tên đã cung cấp",
          },
          resultCode: "00308",
        });
      }

      // 00309 - Thực phẩm này đã tồn tại trong danh sách mua hàng hiện tại
      const { data: existingTask, error: existingError } = await supabase
        .from("shopping_list_tasks")
        .select("id")
        .eq("shopping_list_id", task.shopping_list_id)
        .ilike("food_name", newFoodName.trim())
        .neq("id", taskId)
        .single();

      if (existingTask) {
        return res.status(400).json({
          resultMessage: {
            en: "This food already exists in the current shopping list",
            vn: "Thực phẩm này đã tồn tại trong danh sách mua hàng hiện tại",
          },
          resultCode: "00309",
        });
      }
    }

    // Chuẩn bị dữ liệu update
    const updateData = { updated_at: new Date().toISOString() };

    if (newFoodName !== undefined) {
      updateData.food_name = newFoodName.trim();
    }

    if (newQuantity !== undefined) {
      updateData.quantity = newQuantity.trim();
    }

    // Thực hiện update
    const { data: updatedTask, error: updateError } = await supabase
      .from("shopping_list_tasks")
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 00312 - Cập nhật nhiệm vụ thành công
    res.status(200).json({
      resultMessage: {
        en: "Task updated successfully",
        vn: "Cập nhật nhiệm vụ thành công",
      },
      resultCode: "00312",
      updatedTask: {
        id: updatedTask.id,
        shoppingListId: updatedTask.shopping_list_id,
        foodName: updatedTask.food_name,
        quantity: updatedTask.quantity,
        isDone: updatedTask.is_done,
        createdAt: updatedTask.created_at,
        updatedAt: updatedTask.updated_at,
      },
    });
  } catch (err) {
    console.error("Error updating task:", err.message);
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
