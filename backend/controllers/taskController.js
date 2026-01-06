// controllers/taskController.js
import { supabase, supabaseAdmin } from "../db.js";

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
// ==================== TASKS MANAGEMENT ====================

/**
 * @swagger
 * /task:
 *   post:
 *     summary: Tạo tasks cho mealplan
 *     tags: [Task]
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
 *               - mealplan_id
 *               - name
 *               - description
 *               - assignToUserId
 *             properties:
 *               groupId:
 *                 type: string
 *                 example: "16"
 *               mealplan_id:
 *                 type: string
 *                 example: "3"
 *               name:
 *                 type: string
 *                 example: "Buy milk"
 *               description:
 *                 type: string
 *                 example: "Buy 2 liters of milk"
 *               assignToUserId:
 *                 type: string
 *                 example: "Mai Văn Quân"
 *     responses:
 *       200:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00287"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Task created successfully"
 *                     vn:
 *                       type: string
 *                       example: "Tạo nhiệm vụ thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "task_001"
 *                     name:
 *                       type: string
 *                       example: "Buy milk"
 *                     description:
 *                       type: string
 *                       example: "Buy 2 liters of milk"
 *                     isdone:
 *                       type: boolean
 *                       example: false
 *                     assigntouser_id:
 *                       type: string
 *                       example: "user_123"
 *                     mealplan_id:
 *                       type: string
 *                       example: "3"
 *                     group_id:
 *                       type: string
 *                       example: "16"
 *                     createdat:
 *                       type: string
 *                       format: date-time
 *                     updatedat:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Internal server error
 */
export const createTasks = async (req, res) => {
  try {
    const { groupId, mealplan_id, name, description, assignToUserId } =
      req.body;

    // Validate required fields
    if (!groupId || !mealplan_id || !name || !description) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00276",
      });
    }

    // Validate name
    if (!name.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a task name",
          vn: "Vui lòng cung cấp tên của task",
        },
        resultCode: "00277",
      });
    }

    // Validate description
    if (!description.trim()) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a description",
          vn: "Vui lòng cung cấp mô tả",
        },
        resultCode: "00277",
      });
    }

    // Check if user is admin
    const { data: adminData } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("created_by", req.user.id)
      .maybeSingle();

    if (!adminData) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải là quản trị viên nhóm",
        },
        resultCode: "00281",
      });
    }

    // Check if mealplan  exists
    const { data: existingList } = await supabase
      .from("mealplan")
      .select("id")
      .eq("id", mealplan_id)
      .maybeSingle();

    if (!existingList) {
      return res.status(404).json({
        resultMessage: {
          en: "mealplan not found",
          vn: "Không tìm thấy mealplan",
        },
        resultCode: "00283",
      });
    }

    // Check if assigned user exists
    if (assignToUserId) {
      const { data: assignedUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", assignToUserId)
        .maybeSingle();

      if (!assignedUser) {
        return res.status(404).json({
          resultMessage: {
            en: "Assigned username does not exist",
            vn: "Người dùng được gán không tồn tại",
          },
          resultCode: "00245",
        });
      }
      // Check group membership
      const { data: groupMember } = await supabaseAdmin
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("user_id", assignedUser.id)
        .maybeSingle();

      if (!groupMember) {
        return res.status(403).json({
          resultMessage: {
            en: "Unauthorized access",
            vn: "Không có quyền gán task cho người dùng này",
          },
          resultCode: "00246",
        });
      }
    }

    const taskData = {
      name: name.trim(),
      description: description.trim(),
      isdone: false,
      assigntouser_id: assignToUserId,
      mealplan_id,
      group_id: groupId,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };

    // Insert task & RETURN created task
    const { data: createdTask, error } = await supabase
      .from("task")
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      resultCode: "00287",
      resultMessage: {
        en: "Task created successfully",
        vn: "Tạo nhiệm vụ thành công",
      },
      data: createdTask,
    });
  } catch (err) {
    console.error("Error creating task:", err.message);
    return res.status(500).json({
      resultCode: "00500",
      resultMessage: {
        en: "Internal server error",
        vn: "Lỗi máy chủ nội bộ",
      },
      error: err.message,
    });
  }
};

/**
 * @swagger
 * /task:
 *   patch:
 *     summary: Đánh dấu/bỏ đánh dấu task hoàn thành
 *     tags: [Task]
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
 *               - taskId
 *             properties:
 *               groupId:
 *                 type: string
 *                 example: "16"
 *               taskId:
 *                 type: string
 *                 example: "13"
 *     responses:
 *       200:
 *         description: Task marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00295"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Task marked successfully"
 *                     vn:
 *                       type: string
 *                       example: "Đánh dấu task thành công"
 *                 newStatus:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing taskId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "400"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Missing taskId"
 *                     vn:
 *                       type: string
 *                       example: "Thiếu taskId"
 *       403:
 *         description: User is not admin
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
 *                       example: "not Admin"
 *                     vn:
 *                       type: string
 *                       example: "Không phải admin"
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "404"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Task not found"
 *                     vn:
 *                       type: string
 *                       example: "Không tìm thấy task"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00500"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Internal server error"
 *                     vn:
 *                       type: string
 *                       example: "Lỗi máy chủ nội bộ"
 */
export const markTask = async (req, res) => {
  try {
    const { groupId, taskId } = req.body;

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
      .from("task")
      .select("*")
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

    const { data: isAdmin, error: isAdminError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .eq("created_by", req.user.id);

    if (isAdminError) throw isAdminError;

    if (!isAdmin) {
      return res.status(403).json({
        resultMessage: {
          en: "not Admin",
          vn: "Không phải admin",
        },
      });
    }

    const { error } = await supabase
      .from("task")
      .update({
        isdone: !task.isdone,
        updatedat: new Date().toISOString(),
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
 * /task:
 *   put:
 *     summary: Update task information
 *     description: Update task name, description or assign task to another user (Admin only)
 *     tags:
 *       - Task
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
 *               - taskId
 *             properties:
 *               groupId:
 *                 type: string
 *                 example: "16"
 *               taskId:
 *                 type: string
 *                 example: "33"
 *               name:
 *                 type: string
 *                 example: "Mua tôm"
 *               description:
 *                 type: string
 *                 example: "SaiGon PhanTom"
 *               assignToUserId:
 *                 type: string
 *                 example: "user_789"
 *     responses:
 *       200:
 *         description: Task updated successfully
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
 *                       example: "Task updated successfully"
 *                     vn:
 *                       type: string
 *                       example: "Cập nhật nhiệm vụ thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00312"
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: User is not authorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */

export const updateTask = async (req, res) => {
  try {
    const { groupId, taskId, name, description, assignToUserId } = req.body;

    if (!groupId) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide group ID",
          vn: "Vui lòng cung cấp group ID",
        },
        resultCode: "00302",
      });
    }

    if (!taskId || (typeof taskId === "string" && !taskId.trim())) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a task ID",
          vn: "Vui lòng cung cấp ID nhiệm vụ",
        },
        resultCode: "00301",
      });
    }

    const { data: groupAdmin, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("created_by", req.user.id)
      .maybeSingle();

    if (groupError || !groupAdmin) {
      return res.status(403).json({
        resultMessage: {
          en: "User is not a group admin",
          vn: "Người dùng không phải quản trị viên nhóm",
        },
        resultCode: "00307",
      });
    }

    if (
      name === undefined &&
      description === undefined &&
      assignToUserId === undefined
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "No fields provided to update",
          vn: "Không có dữ liệu nào để cập nhật",
        },
        resultCode: "00313",
      });
    }

    let updateFields = {
      updatedat: new Date().toISOString(),
    };

    if (assignToUserId !== undefined) {
      const { data: groupMember } = await supabaseAdmin
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("user_id", assignToUserId)
        .maybeSingle();

      if (!groupMember) {
        return res.status(403).json({
          resultMessage: {
            en: "User is not a member of this group",
            vn: "Người dùng không thuộc nhóm này",
          },
          resultCode: "00246",
        });
      }

      updateFields.assigntouser_id = assignToUserId;
    }

    if (name !== undefined) {
      if (!nameRegex.test(name) || name.length < 2 || name.length > 50) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid name",
            vn: "Tên không hợp lệ",
          },
          resultCode: "00303",
        });
      }
      updateFields.name = name.trim();
    }

    if (description !== undefined) {
      updateFields.description = description.trim();
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from("task")
      .update(updateFields)
      .eq("id", taskId)
      .eq("group_id", groupId)
      .select()
      .single();

    if (updateError) throw updateError;

    if (!updatedTask) {
      return res.status(404).json({
        resultMessage: {
          en: "Task not found",
          vn: "Không tìm thấy nhiệm vụ",
        },
        resultCode: "00304",
      });
    }

    return res.status(200).json({
      resultMessage: {
        en: "Task updated successfully",
        vn: "Cập nhật nhiệm vụ thành công",
      },
      resultCode: "00312",
      data: updatedTask,
    });
  } catch (err) {
    console.error("Error updating task:", err.message);
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
 * /task:
 *   delete:
 *     summary: Xóa task
 *     tags: [Task]
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
 *               - taskId
 *             properties:
 *               groupId:
 *                 type: string
 *                 example: "16"
 *               taskId:
 *                 type: string
 *                 example: "13"
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00299"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Task deleted successfully"
 *                     vn:
 *                       type: string
 *                       example: "Xóa nhiệm vụ thành công"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00293"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Please provide id fields"
 *                     vn:
 *                       type: string
 *                       example: "Vui lòng cung cấp id"
 *       403:
 *         description: Permission denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00297"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Access denied. Only group admins can perform this action."
 *                     vn:
 *                       type: string
 *                       example: "Truy cập không được ủy quyền, bạn không phải admin"
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00296"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Task not found with the provided ID"
 *                     vn:
 *                       type: string
 *                       example: "Không tìm thấy nhiệm vụ với ID đã cung cấp"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00500"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Internal server error"
 *                     vn:
 *                       type: string
 *                       example: "Lỗi máy chủ nội bộ"
 */
export const deleteTask = async (req, res) => {
  try {
    const { groupId, taskId } = req.body;

    // Validate taskId exists
    if (!taskId) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide id fields",
          vn: "Vui lòng cung cấp id",
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
      .eq("created_by", req.user.id)
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

/**
 * @swagger
 * /task/getAll:
 *   post:
 *     summary: Get all tasks by meal plan
 *     description: Lấy danh sách task theo mealplan_id, sắp xếp theo thời gian tạo giảm dần
 *     tags:
 *       - Task
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
 *                 type: string
 *                 example: "mealplan_123"
 *     responses:
 *       200:
 *         description: Get tasks successfully
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
 *                       example: "Get tasks successfull"
 *                     vn:
 *                       type: string
 *                       example: "Lấy các task thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00379"
 *                 task:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Buy vegetables"
 *                       description:
 *                         type: string
 *                         example: "Buy carrots and tomatoes"
 *                       assigntouser_id:
 *                         type: string
 *                         example: "user_001"
 *                       isdone:
 *                         type: boolean
 *                         example: false
 *                       mealplan_id:
 *                         type: string
 *                         example: "mealplan_123"
 *                       group_id:
 *                         type: string
 *                         example: "group_01"
 *                       createdat:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-01-05T10:30:00Z"
 *                       updatedat:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-01-05T11:00:00Z"
 *       500:
 *         description: Internal server error
 */

export const getAllTasks = async (req, res) => {
  try {
    const { mealplan_id } = req.body;
    const { data: tasks, error } = await supabase
      .from("task")
      .select("*")
      .eq("mealplan_id", mealplan_id)
      .order("createdat", { ascending: false });

    if (error) throw error;

    const formattedTask = tasks.map((task) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      assigntouser_id: task.assigntouser_id,
      isdone: task.isdone,
      mealplan_id: task.mealplan_id,
      group_id: task.group_id,
      createdat: task.createdat,
      updatedat: task.updatedat,
    }));

    res.status(200).json({
      resultMessage: {
        en: "Get tasks successfull",
        vn: "Lấy các task thành công",
      },
      resultCode: "00379",
      task: formattedTask,
    });
  } catch (err) {
    console.error("Error getting all task:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

/**
 * @swagger
 * /task/detail:
 *   post:
 *     summary: Get task detail by ID
 *     description: Retrieve task detail using taskId from request body
 *     tags:
 *       - Task
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
 *                 type: string
 *                 example: "1"
 *     responses:
 *       200:
 *         description: Get task detail successfully
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
 *                       example: Get task detail successfully
 *                     vn:
 *                       type: string
 *                       example: Lấy chi tiết task thành công
 *                 resultCode:
 *                   type: string
 *                   example: "00379"
 *                 task:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Buy milk
 *                     description:
 *                       type: string
 *                       example: Buy 2 liters of milk
 *                     assigntouser_id:
 *                       type: integer
 *                       example: 3
 *                     isdone:
 *                       type: boolean
 *                       example: false
 *                     mealplan_id:
 *                       type: integer
 *                       example: 10
 *                     group_id:
 *                       type: integer
 *                       example: 2
 *                     createdat:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-01-01T10:00:00Z
 *                     updatedat:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-01-02T12:00:00Z
 *       400:
 *         description: Missing or invalid taskId
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */

export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.body;

    // 00371 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (!taskId) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00380",
      });
    }

    // 00372 - Vui lòng cung cấp một ID công thức hợp lệ
    if (
      (typeof taskId !== "string" && typeof taskId !== "number") ||
      (typeof taskId === "string" && taskId.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid task ID",
          vn: "Vui lòng cung cấp một ID task hợp lệ",
        },
        resultCode: "00381",
      });
    }

    // Lấy task theo ID
    const { data: task, error } = await supabase
      .from("task")
      .select("*")
      .eq("id", taskId)
      .single();

    // 00373 - Không tìm thấy công thức
    if (error || !task) {
      return res.status(404).json({
        resultMessage: {
          en: "Task not found with the provided ID",
          vn: "Không tìm thấy task với ID đã cung cấp",
        },
        resultCode: "00382",
      });
    }

    const formattedTask = {
      id: task.id,
      name: task.name,
      description: task.description,
      assigntouser_id: task.assigntouser_id,
      isdone: task.isdone,
      mealplan_id: task.mealplan_id,
      group_id: task.group_id,
      createdat: task.createdat,
      updatedat: task.updatedat,
    };

    res.status(200).json({
      resultMessage: {
        en: "Get task detail successfully",
        vn: "Lấy chi tiết task thành công",
      },
      resultCode: "00379",
      task: formattedTask,
    });
  } catch (err) {
    console.error("Error getting task by id:", err.message);
    res.status(500).json({
      resultMessage: {
        en: "Internal server error",
        vn: "Lỗi máy chủ nội bộ",
      },
      resultCode: "00500",
    });
  }
};
