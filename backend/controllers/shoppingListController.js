// controllers/shoppingListController.js
import { supabase } from "../db.js";

// Helper function to validate and format date
const validateAndFormatDate = (dateString) => {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }

  const parts = dateString.split("/");
  if (parts.length !== 3) {
    return null;
  }

  const [month, day, year] = parts;
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(monthNum) || isNaN(dayNum) || isNaN(yearNum)) {
    return null;
  }

  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    return null;
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

export const createShoppingList = async (req, res) => {
  try {
    const { name, assignToUsername, note, date } = req.body;

    if (!name || !assignToUsername || !date) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing required fields",
          vn: "Thiếu thông tin bắt buộc",
        },
        resultCode: "400",
      });
    }

    // Validate date format
    const formattedDate = validateAndFormatDate(date);
    if (!formattedDate) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid date format. Expected MM/DD/YYYY",
          vn: "Định dạng ngày không hợp lệ. Yêu cầu MM/DD/YYYY",
        },
        resultCode: "400",
      });
    }

    // Find user by username
    const { data: assignedUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", assignToUsername)
      .single();

    if (userError || !assignedUser) {
      return res.status(404).json({
        resultMessage: {
          en: "User not found",
          vn: "Không tìm thấy người dùng",
        },
        resultCode: "404",
      });
    }

    // Insert shopping list
    const { data, error } = await supabase
      .from("shopping_list")
      .insert([
        {
          name,
          note: note || null,
          assign_to_username: assignToUsername,
          assigned_to_user_id: assignedUser.id,
          date: formattedDate,
          belongs_to_admin_id: req.user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

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
      error: "Internal server error",
    });
  }
};

export const updateShoppingList = async (req, res) => {
  try {
    const { listId, newName, newAssignToUsername, newDate, newNote } = req.body;

    if (!listId) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing listId",
          vn: "Thiếu listId",
        },
        resultCode: "400",
      });
    }

    // Check if list exists and belongs to user
    const { data: existingList, error: fetchError } = await supabase
      .from("shopping_list")
      .select("belongs_to_admin_id")
      .eq("id", listId)
      .single();

    if (fetchError || !existingList) {
      return res.status(404).json({
        resultMessage: {
          en: "Shopping list not found",
          vn: "Không tìm thấy danh sách mua sắm",
        },
        resultCode: "404",
      });
    }

    if (existingList.belongs_to_admin_id !== req.user?.id) {
      return res.status(403).json({
        resultMessage: {
          en: "Permission denied",
          vn: "Không có quyền",
        },
        resultCode: "403",
      });
    }

    // Build update object
    const updateData = { updated_at: new Date().toISOString() };

    if (newName !== undefined) {
      if (!newName || newName.trim() === "") {
        return res.status(400).json({
          resultMessage: {
            en: "Name cannot be empty",
            vn: "Tên không được để trống",
          },
          resultCode: "400",
        });
      }
      updateData.name = newName;
    }

    if (newAssignToUsername !== undefined) {
      // Find new assigned user
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", newAssignToUsername)
        .single();

      if (userError || !newUser) {
        return res.status(404).json({
          resultMessage: {
            en: "User not found",
            vn: "Không tìm thấy người dùng",
          },
          resultCode: "404",
        });
      }

      updateData.assign_to_username = newAssignToUsername;
      updateData.assigned_to_user_id = newUser.id;
    }

    if (newNote !== undefined) {
      updateData.note = newNote;
    }

    if (newDate !== undefined) {
      const formattedDate = validateAndFormatDate(newDate);
      if (!formattedDate) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid date format. Expected MM/DD/YYYY",
            vn: "Định dạng ngày không hợp lệ. Yêu cầu MM/DD/YYYY",
          },
          resultCode: "400",
        });
      }
      updateData.date = formattedDate;
    }

    // Update list
    const { data, error } = await supabase
      .from("shopping_list")
      .update(updateData)
      .eq("id", listId)
      .select()
      .single();

    if (error) throw error;

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
      error: "Internal server error",
    });
  }
};

export const deleteShoppingList = async (req, res) => {
  try {
    const { listId } = req.body;

    if (!listId) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing listId",
          vn: "Thiếu listId",
        },
        resultCode: "400",
      });
    }

    // Check if list exists and belongs to user
    const { data: existingList, error: fetchError } = await supabase
      .from("shopping_list")
      .select("belongs_to_admin_id")
      .eq("id", listId)
      .single();

    if (fetchError || !existingList) {
      return res.status(404).json({
        resultMessage: {
          en: "Shopping list not found",
          vn: "Không tìm thấy danh sách mua sắm",
        },
        resultCode: "404",
      });
    }

    if (existingList.belongs_to_admin_id !== req.user?.id) {
      return res.status(403).json({
        resultMessage: {
          en: "Permission denied",
          vn: "Không có quyền",
        },
        resultCode: "403",
      });
    }

    // Delete list (tasks will be cascade deleted if foreign key is set up properly)
    const { error } = await supabase
      .from("shopping_list")
      .delete()
      .eq("id", listId);

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Shopping list deletion completed!",
        vn: "Xóa danh sách mua sắm thành công",
      },
      resultCode: "00275",
    });
  } catch (err) {
    console.error("Error deleting shopping list:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const createTasks = async (req, res) => {
  try {
    const { listId, tasks } = req.body;

    // Validate input
    if (!listId || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing required fields",
          vn: "Thiếu thông tin bắt buộc",
        },
        resultCode: "400",
      });
    }

    if (tasks.length === 0) {
      return res.status(400).json({
        resultMessage: {
          en: "Tasks array cannot be empty",
          vn: "Danh sách nhiệm vụ không được rỗng",
        },
        resultCode: "400",
      });
    }

    // Validate each task
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task.foodName || task.foodName.trim() === "") {
        return res.status(400).json({
          resultMessage: {
            en: `Task ${i + 1}: Food name is required`,
            vn: `Nhiệm vụ ${i + 1}: Tên thực phẩm là bắt buộc`,
          },
          resultCode: "400",
        });
      }
      if (!task.quantity || task.quantity.trim() === "") {
        return res.status(400).json({
          resultMessage: {
            en: `Task ${i + 1}: Quantity is required`,
            vn: `Nhiệm vụ ${i + 1}: Số lượng là bắt buộc`,
          },
          resultCode: "400",
        });
      }
    }

    // Check if shopping list exists and belongs to user
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
        resultCode: "404",
      });
    }

    if (existingList.belongs_to_admin_id !== req.user?.id) {
      return res.status(403).json({
        resultMessage: {
          en: "Permission denied",
          vn: "Không có quyền",
        },
        resultCode: "403",
      });
    }

    // Prepare tasks data
    const taskData = tasks.map((task) => ({
      shopping_list_id: listId,
      food_name: task.foodName.trim(),
      quantity: task.quantity.trim(),
      is_done: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert tasks
    const { error } = await supabase
      .from("shopping_list_tasks")
      .insert(taskData);

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Add tasks successfully",
        vn: "Thêm nhiệm vụ thành công",
      },
      resultCode: "00287",
    });
  } catch (err) {
    console.error("Error creating tasks:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getListOfTasks = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        resultMessage: {
          en: "Unauthorized",
          vn: "Chưa xác thực",
        },
        resultCode: "401",
      });
    }

    // Get shopping lists of user
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

    // Get tasks for each list
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

    // Get current task info
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

    // Check permission
    if (task.shopping_list.belongs_to_admin_id !== req.user?.id) {
      return res.status(403).json({
        resultMessage: {
          en: "Permission denied",
          vn: "Không có quyền",
        },
        resultCode: "403",
      });
    }

    // Toggle done status
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

export const deleteTask = async (req, res) => {
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

    // Check if task exists and user has permission
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

    // Delete task
    const { error } = await supabase
      .from("shopping_list_tasks")
      .delete()
      .eq("id", taskId);

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Task deleted successfully",
        vn: "Xóa task thành công",
      },
      resultCode: "00296",
    });
  } catch (err) {
    console.error("Error deleting task:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { taskId, newFoodName, newQuantity } = req.body;

    if (!taskId) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing taskId",
          vn: "Thiếu taskId",
        },
        resultCode: "400",
      });
    }

    // Check if task exists and user has permission
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

    // Build update object
    const updateData = { updated_at: new Date().toISOString() };

    if (newFoodName !== undefined) {
      if (!newFoodName || newFoodName.trim() === "") {
        return res.status(400).json({
          resultMessage: {
            en: "Food name cannot be empty",
            vn: "Tên thực phẩm không được để trống",
          },
          resultCode: "400",
        });
      }
      updateData.food_name = newFoodName.trim();
    }

    if (newQuantity !== undefined) {
      if (!newQuantity || newQuantity.trim() === "") {
        return res.status(400).json({
          resultMessage: {
            en: "Quantity cannot be empty",
            vn: "Số lượng không được để trống",
          },
          resultCode: "400",
        });
      }
      updateData.quantity = newQuantity.trim();
    }

    // Update task
    const { error } = await supabase
      .from("shopping_list_tasks")
      .update(updateData)
      .eq("id", taskId);

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Task updated successfully",
        vn: "Cập nhật task thành công",
      },
      resultCode: "00297",
    });
  } catch (err) {
    console.error("Error updating task:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
