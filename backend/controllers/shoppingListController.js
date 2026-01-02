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
 * /shopping-list:
 *   post:
 *     summary: Tạo danh sách mua sắm mới
 *     tags: [Shopping List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, assignToUsername, date]
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
 *     responses:
 *       200:
 *         description: Tạo danh sách mua sắm thành công (00249)
 *       400:
 *         description: Thiếu trường bắt buộc (00238-00242)
 *       401:
 *         description: Không có quyền truy cập (00243)
 *       403:
 *         description: Không có quyền gán cho user này (00246)
 *       404:
 *         description: Username không tồn tại (00245)
 *       500:
 *         description: Lỗi máy chủ (00500)
 */
export const createShoppingList = async (req, res) => {
  try {
    const { name, assignToUsername, note, date } = req.body;
    const groupId = req.params.groupId;
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
    if (!assignToUsername.trim() || !assignToUsername) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide assignToUsername",
          vn: "Vui lòng cung cấp assignToUsername",
        },
        resultCode: "00240",
      });
    }

    if (
      !nameRegex.test(assignToUsername) ||
      assignToUsername.length < 2 ||
      assignToUsername.length > 50
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

    // Validate and format date
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

    // Check authentication
    const { data: groupAdmin, error: groupError } = await supabase
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
    }

    // Check if assigned user exists
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
    }

    // Check permission to assign
    const { data: groupMember } = await supabase
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
    }

    // Create shopping list
    const { data, error } = await supabase
      .from("shoppinglist")
      .insert([
        {
          name: name.trim(),
          note: note ? note.trim() : null,
          assignedtousername: assignToUsername,
          assignedtouserid: assignedUser.id,
          date: formattedDate,
          belongstogroupadminid: userID,
          group_id: groupId,
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
 * /shopping-list:
 *   get:
 *     summary: Lấy danh sách tất cả shopping lists với tasks
 *     tags: [Shopping List]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công (00292)
 *       401:
 *         description: Người dùng chưa thuộc nhóm nào (00288)
 *       500:
 *         description: Lỗi máy chủ
 */
export const getAllShoppingLists = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        resultMessage: {
          en: "Unauthorized",
          vn: "Chưa xác thực",
        },
      });
    }

    // Chỉ lấy danh sách shopping lists, không lấy tasks
    const { data: lists, error: listError } = await supabase
      .from("shoppinglist")
      .select("*")
      .eq("belongstogroupadminid", userId)
      .order("createdat", { ascending: false });

    if (listError) {
      console.error(" List Error:", listError);
      throw listError;
    }

    if (!lists || lists.length === 0) {
      return res.status(200).json({
        resultMessage: {
          en: "No shopping lists found",
          vn: "Không tìm thấy danh sách mua sắm",
        },
        data: [],
      });
    }

    // Trả về danh sách shopping lists (không có details)
    const result = lists.map((list) => ({
      id: list.id,
      name: list.name,
      note: list.note,
      date: list.date,
      userid: list.userid,
      belongstogroup: list.belongstogroup,
      assignedtouse: list.assignedtouse,
      group_id: list.group_id,
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
    const { currentName, newName, newAssignToUsername, newDate, newNote } =
      req.body;

    // Validate listId
    if (!currentName) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide current list name",
          vn: "Vui lòng cung cấp tên danh sách hiện tại",
        },
        resultCode: "00251",
      });
    }

    // Validate at least one field to update
    if (
      !newName?.trim() &&
      !newAssignToUsername?.trim() &&
      !newDate?.trim() &&
      !newNote?.trim()
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide at least one of the following fields: newName, newAssignToUsername, newNote, newDate",
          vn: "Vui lòng cung cấp ít nhất một trong những trường sau, newName, newAssignToUsername, newNote, newDate",
        },
        resultCode: "00252",
      });
    }

    // Validate newName
    if (!nameRegex.test(newName) || newName.length < 2 || newName.length > 50) {
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
      !nameRegex.test(newAssignToUsername) ||
      newAssignToUsername.length < 2 ||
      newAssignToUsername.length > 50
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid new assignee username format",
          vn: "Định dạng tên người được giao mới không hợp lệ",
        },
        resultCode: "00254",
      });
    }

    // Validate newNote
    if (xssPattern.test(newNote) || newNote.length > 500) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid new note format",
          vn: "Định dạng ghi chú mới không hợp lệ",
        },
        resultCode: "00255",
      });
    }

    // Validate and format newDate
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

    const groupId = req.params.groupId;

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
      .eq("name", currentName)
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

    // Check if user is the owner
    const { data: isAdmin, error: isAdminError } = await supabase
      .from("shoppinglist")
      .select("name, belongstogroupadminid, group_id")
      .eq("group_id", groupId)
      .eq("belongstogroupadminid", req.user.id)
      .eq("name", currentName)
      .maybeSingle();

    if (isAdminError || !isAdmin) {
      return res.status(403).json({
        resultMessage: {
          en: "The user is not an administrator of this shopping list",
          vn: "Người dùng không phải là quản trị viên của danh sách mua sắm này",
        },
        resultCode: "00261",
      });
    }

    const updateData = { updatedat: new Date().toISOString() };

    // Update name
    if (newName !== undefined) {
      updateData.name = newName.trim();
    }

    // Update assignusername
    if (newAssignToUsername !== undefined) {
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", newAssignToUsername)
        .maybeSingle();

      if (userError || !newUser) {
        return res.status(404).json({
          resultMessage: {
            en: "User does not exist",
            vn: "Người dùng không tồn tại",
          },
          resultCode: "00262",
        });
      }
      // Check permission to assign
      const { data: groupNewMember } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("user_id", newUser.id)
        .maybeSingle();

      if (!groupNewMember) {
        return res.status(403).json({
          resultMessage: {
            en: "User does not have permission to assign this list to the username",
            vn: "Người dùng không có quyền gán danh sách này cho tên người dùng",
          },
          resultCode: "00263",
        });
      }

      updateData.assignedtousername = newAssignToUsername;
      updateData.assignedtouserid = newUser.id;
    }

    // Update note
    if (newNote !== undefined) {
      updateData.note = newNote ? newNote.trim() : null;
    }

    // Update date
    if (newDate !== undefined) {
      updateData.date = formattedDate;
    }

    // Perform update
    const { data, error } = await supabase
      .from("shoppinglist")
      .update(updateData)
      .eq("name", currentName)
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

// ==================== TASKS MANAGEMENT ====================

/**
 * @swagger
 * /shopping-list/tasks:
 *   post:
 *     summary: Tạo tasks cho shopping list
 *     tags: [Shopping List Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listId, tasks]
 *             properties:
 *               listId:
 *                 type: integer
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     foodName:
 *                       type: string
 *                     quantity:
 *                       type: string
 *     responses:
 *       200:
 *         description: Thêm tasks thành công (00287)
 *       400:
 *         description: Lỗi validation (00276-00279, 00286)
 *       403:
 *         description: Không có quyền (00281, 00284)
 *       404:
 *         description: Không tìm thấy (00283, 00285)
 *       500:
 *         description: Lỗi máy chủ (00500)
 */
export const createTasks = async (req, res) => {
  try {
    const { listName, tasks } = req.body;
    const groupId = req.params.groupId;

    // Validate required fields
    /*if (!listName || !tasks) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00276",
      });
    }*/

    // Validate listId
    if (!listName || (typeof listName === "string" && !listName.trim())) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a list name",
          vn: "Vui lòng cung cấp một name của danh sách",
        },
        resultCode: "00277",
      });
    }

    // Validate tasks array
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a tasks array",
          vn: "Vui lòng cung cấp một mảng nhiệm vụ",
        },
        resultCode: "00278",
      });
    }

    // Validate tasks fields
    for (const task of tasks) {
      if (
        typeof task !== "object" ||
        task === null ||
        !task.foodName ||
        typeof task.foodName !== "string" ||
        !task.foodName.trim() ||
        !task.quantity ||
        typeof task.quantity !== "string" ||
        !task.quantity.trim()
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

    // Check if user is admin
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
        resultCode: "00281",
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
        resultCode: "00283",
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
        resultCode: "00284",
      });
    }

    // Validate food names exist in foods table
    const foodNames = tasks.map((task) => task.foodName.trim()); // Đừng toLowerCase ở đây vội

    const { data: foodsData, error: foodsError } = await supabase
      .from("food")
      .select("name")
      .in("name", foodNames);

    if (foodsError) throw foodsError;

    const existingFoodNames = foodsData.map((food) =>
      food.name.trim().toLowerCase()
    );
    const missingFoods = foodNames.filter(
      (name) => !existingFoodNames.includes(name.toLowerCase())
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

    // Check for duplicate foods in shopping list
    const foodNamess = tasks.map((task) => task.foodName.trim().toLowerCase());

    const duplicatesInArray = foodNamess.filter(
      (name, index) => foodNamess.indexOf(name) !== index
    );

    if (duplicatesInArray.length > 0) {
      return res.status(400).json({
        resultMessage: {
          en: "This food type already exists in the list",
          vn: "Loại thức ăn này đã có trong danh sách rồi",
        },
        resultCode: "00286",
      });
    }

    // Prepare task data
    const { data: isUserName, error: UserNameError } = await supabase
      .from("shoppinglist")
      .select("name, belongstogroupadminid, assignedtousername")
      .eq("name", listName)
      .maybeSingle();

    if (UserNameError) throw UserNameError;

    const taskData = tasks.map((task) => ({
      name: task.foodName.trim(),
      quantity: task.quantity.trim(),
      isdone: false,
      shoppinglistname: listName,
      username: isUserName.assignedtousername,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    }));

    // Insert tasks
    const { data: insertedTasks, error: insertError } = await supabase
      .from("task")
      .insert(taskData)
      .select();

    if (insertError) throw insertError;

    res.status(200).json({
      resultMessage: {
        en: "Tasks added successfully",
        vn: "Thêm nhiệm vụ thành công",
      },
      resultCode: "00287",
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
 * /shopping-list/tasks/mark:
 *   put:
 *     summary: Đánh dấu/bỏ đánh dấu task hoàn thành
 *     tags: [Shopping List Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskId]
 *             properties:
 *               taskId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Đánh dấu thành công (00295)
 *       400:
 *         description: Thiếu taskId (400)
 *       403:
 *         description: Không có quyền (403)
 *       404:
 *         description: Không tìm thấy task (404)
 *       500:
 *         description: Lỗi máy chủ
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
      .maybeSingle();

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
 * /shopping-list/tasks:
 *   put:
 *     summary: Cập nhật task
 *     tags: [Shopping List Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskId]
 *             properties:
 *               taskId:
 *                 type: integer
 *               newFoodName:
 *                 type: string
 *               newQuantity:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công (00312)
 *       400:
 *         description: Lỗi validation (00300-00304, 00309)
 *       403:
 *         description: Không có quyền (00307)
 *       404:
 *         description: Không tìm thấy (00306, 00308)
 *       500:
 *         description: Lỗi máy chủ (00500)
 */
export const updateTask = async (req, res) => {
  try {
    const { taskId, newFoodName, newQuantity } = req.body;

    // Validate taskId
    if (!taskId || (typeof taskId === "string" && !taskId.trim())) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a task ID in the taskId field",
          vn: "Vui lòng cung cấp một ID nhiệm vụ trong trường taskId",
        },
        resultCode: "00301",
      });
    }

    // Validate at least one field to update
    if (newFoodName === undefined && newQuantity === undefined) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide at least one of the following fields: newFoodName, newQuantity",
          vn: "Vui lòng cung cấp ít nhất một trong các trường sau, newFoodName, newQuantity",
        },
        resultCode: "00302",
      });
    }

    // Validate newFoodName
    if (
      newFoodName !== undefined &&
      (typeof newFoodName !== "string" || !newFoodName.trim())
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid newFoodName",
          vn: "Vui lòng cung cấp một newFoodName hợp lệ",
        },
        resultCode: "00303",
      });
    }

    // Validate newQuantity
    if (
      newQuantity !== undefined &&
      (typeof newQuantity !== "string" || !newQuantity.trim())
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid newQuantity",
          vn: "Vui lòng cung cấp một newQuantity hợp lệ",
        },
        resultCode: "00304",
      });
    }

    // Check if user is admin
    if (!req.user?.id) {
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
      .select("id, role, belongstogroupadminid")
      .eq("id", req.user.id)
      .maybeSingle();

    if (adminError || !adminData || adminData.role !== "admin") {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00307",
      });
    }

    // Check if task exists
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
      .maybeSingle();

    if (fetchError || !task) {
      return res.status(404).json({
        resultMessage: {
          en: "Task not found with the provided ID",
          vn: "Không tìm thấy nhiệm vụ với ID đã cung cấp",
        },
        resultCode: "00306",
      });
    }

    // Check if user is the owner
    if (task.shopping_list?.belongs_to_admin_id !== req.user.id) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00307",
      });
    }

    // If newFoodName, validate it exists in foods table
    if (newFoodName !== undefined) {
      const { data: foodData, error: foodError } = await supabase
        .from("foods")
        .select("name")
        .ilike("name", newFoodName.trim())
        .maybeSingle();

      if (foodError || !foodData) {
        return res.status(404).json({
          resultMessage: {
            en: "Food not found with the provided name",
            vn: "Không tìm thấy nhiệm vụ với tên đã cung cấp",
          },
          resultCode: "00308",
        });
      }

      // Check if food already exists in current shopping list
      const { data: existingTask, error: existingError } = await supabase
        .from("shopping_list_tasks")
        .select("id")
        .eq("shopping_list_id", task.shopping_list_id)
        .ilike("food_name", newFoodName.trim())
        .neq("id", taskId)
        .maybeSingle();

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

    // Prepare update data
    const updateData = { updated_at: new Date().toISOString() };

    if (newFoodName !== undefined) {
      updateData.food_name = newFoodName.trim();
    }

    if (newQuantity !== undefined) {
      updateData.quantity = newQuantity.trim();
    }

    // Perform update
    const { data: updatedTask, error: updateError } = await supabase
      .from("shopping_list_tasks")
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single();

    if (updateError) throw updateError;

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

/**
 * @swagger
 * /shopping-list/tasks:
 *   delete:
 *     summary: Xóa task
 *     tags: [Shopping List Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskId]
 *             properties:
 *               taskId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công (00299)
 *       400:
 *         description: Thiếu/sai taskId (00293, 00294)
 *       403:
 *         description: Không có quyền (00297)
 *       404:
 *         description: Không tìm thấy task (00296)
 *       500:
 *         description: Lỗi máy chủ (00500)
 */
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    const groupId = req.params.groupId;
    const userID = req.user.id;

    // Validate taskId exists
    if (!taskId) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00293",
      });
    }

    // Validate taskId format
    if (
      (typeof taskId === "string" && !taskId.trim()) ||
      (typeof taskId !== "string" && typeof taskId !== "number")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a task ID in the taskId field",
          vn: "Vui lòng cung cấp một ID nhiệm vụ trong trường taskId",
        },
        resultCode: "00294",
      });
    }

    // Check if user is admin
    const { data: groupAdmin, error: groupError } = await supabase
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
        resultCode: "00297",
      });
    }

    // Check if task exists
    const { data: existingTask, error: fetchError } = await supabase
      .from("task")
      .select("id")
      .eq("id", taskId)
      .maybeSingle();

    if (fetchError || !existingTask) {
      return res.status(404).json({
        resultMessage: {
          en: "Task not found with the provided ID",
          vn: "Không tìm thấy nhiệm vụ với ID đã cung cấp",
        },
        resultCode: "00296",
      });
    }

    // Check if user is the owner
    const { data: groupAdmintodelete, error: grouptodeleteError } =
      await supabase
        .from("groups")
        .select("id, created_by")
        .eq("id", groupId)
        .eq("created_by", req.user.id)
        .maybeSingle();

    if (grouptodeleteError || !groupAdmintodelete) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00297",
      });
    }

    // Delete task
    const { error: deleteError } = await supabase
      .from("task")
      .delete()
      .eq("id", taskId);

    if (deleteError) throw deleteError;

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
