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

