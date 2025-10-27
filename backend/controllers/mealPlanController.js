// controllers/mealPlanController.js
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

// Helper function to format date back to M/D/YYYY
const formatDateToDisplay = (dateString) => {
  if (!dateString) return null;

  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

export const createMealPlan = async (req, res) => {
  try {
    const { foodName, timestamp, name } = req.body;

    if (!foodName || !timestamp || !name) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing required fields",
          vn: "Thiếu thông tin bắt buộc",
        },
        resultCode: "400",
      });
    }

    // Validate timestamp format
    const formattedDate = validateAndFormatDate(timestamp);
    if (!formattedDate) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid timestamp format. Expected M/D/YYYY",
          vn: "Định dạng thời gian không hợp lệ. Yêu cầu M/D/YYYY",
        },
        resultCode: "400",
      });
    }

    // Find food by name
    const { data: food, error: foodError } = await supabase
      .from("foods")
      .select("id")
      .eq("name", foodName)
      .single();

    if (foodError || !food) {
      return res.status(404).json({
        resultMessage: {
          en: "Food not found",
          vn: "Không tìm thấy thực phẩm",
        },
        resultCode: "404",
      });
    }

    // Insert meal plan
    const { data, error } = await supabase
      .from("meal_plans")
      .insert([
        {
          name: name.trim(),
          timestamp: formattedDate,
          status: "NOT_PASS_YET",
          food_id: food.id,
          user_id: req.user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Add meal plan successfull",
        vn: "Thêm kế hoạch bữa ăn thành công",
      },
      resultCode: "00322",
      newPlan: {
        id: data.id,
        name: data.name,
        timestamp: formatDateToDisplay(data.timestamp),
        status: data.status,
        FoodId: data.food_id,
        UserId: data.user_id,
        updatedAt: data.updated_at,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error("Error creating meal plan:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateMealPlan = async (req, res) => {
  try {
    const { planId, newFoodName, newTimestamp, newName, newStatus } = req.body;

    if (!planId) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing planId",
          vn: "Thiếu planId",
        },
        resultCode: "400",
      });
    }

    // Check if meal plan exists and belongs to user
    const { data: existingPlan, error: fetchError } = await supabase
      .from("meal_plans")
      .select("user_id")
      .eq("id", planId)
      .single();

    if (fetchError || !existingPlan) {
      return res.status(404).json({
        resultMessage: {
          en: "Meal plan not found",
          vn: "Không tìm thấy kế hoạch bữa ăn",
        },
        resultCode: "404",
      });
    }

    if (existingPlan.user_id !== req.user?.id) {
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
      updateData.name = newName.trim();
    }

    if (newFoodName !== undefined) {
      // Find food by name
      const { data: food, error: foodError } = await supabase
        .from("foods")
        .select("id")
        .eq("name", newFoodName)
        .single();

      if (foodError || !food) {
        return res.status(404).json({
          resultMessage: {
            en: "Food not found",
            vn: "Không tìm thấy thực phẩm",
          },
          resultCode: "404",
        });
      }

      updateData.food_id = food.id;
    }

    if (newTimestamp !== undefined) {
      const formattedDate = validateAndFormatDate(newTimestamp);
      if (!formattedDate) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid timestamp format. Expected M/D/YYYY",
            vn: "Định dạng thời gian không hợp lệ. Yêu cầu M/D/YYYY",
          },
          resultCode: "400",
        });
      }
      updateData.timestamp = formattedDate;
    }

    if (newStatus !== undefined) {
      const validStatuses = ["NOT_PASS_YET", "PASSED", "SKIPPED"];
      if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid status. Must be NOT_PASS_YET, PASSED, or SKIPPED",
            vn: "Trạng thái không hợp lệ. Phải là NOT_PASS_YET, PASSED, hoặc SKIPPED",
          },
          resultCode: "400",
        });
      }
      updateData.status = newStatus;
    }

    // Update meal plan
    const { data, error } = await supabase
      .from("meal_plans")
      .update(updateData)
      .eq("id", planId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Meal plan updated successfully",
        vn: "Cập nhật kế hoạch bữa ăn thành công",
      },
      resultCode: "00326",
      updatedPlan: {
        id: data.id,
        name: data.name,
        timestamp: formatDateToDisplay(data.timestamp),
        status: data.status,
        FoodId: data.food_id,
        UserId: data.user_id,
        updatedAt: data.updated_at,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error("Error updating meal plan:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deleteMealPlan = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing planId",
          vn: "Thiếu planId",
        },
        resultCode: "400",
      });
    }

    // Check if meal plan exists and belongs to user
    const { data: existingPlan, error: fetchError } = await supabase
      .from("meal_plans")
      .select("user_id")
      .eq("id", planId)
      .single();

    if (fetchError || !existingPlan) {
      return res.status(404).json({
        resultMessage: {
          en: "Meal plan not found",
          vn: "Không tìm thấy kế hoạch bữa ăn",
        },
        resultCode: "404",
      });
    }

    if (existingPlan.user_id !== req.user?.id) {
      return res.status(403).json({
        resultMessage: {
          en: "Permission denied",
          vn: "Không có quyền",
        },
        resultCode: "403",
      });
    }

    // Delete meal plan
    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", planId);

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Your meal plan was deleted successfully.",
        vn: "Kế hoạch bữa ăn của bạn đã được xóa thành công",
      },
      resultCode: "00330",
    });
  } catch (err) {
    console.error("Error deleting meal plan:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getMealPlansByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing date parameter",
          vn: "Thiếu tham số date",
        },
        resultCode: "400",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        resultMessage: {
          en: "Unauthorized",
          vn: "Chưa xác thực",
        },
        resultCode: "401",
      });
    }

    // Validate and format date
    const formattedDate = validateAndFormatDate(date);
    if (!formattedDate) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid date format. Expected M/D/YYYY",
          vn: "Định dạng ngày không hợp lệ. Yêu cầu M/D/YYYY",
        },
        resultCode: "400",
      });
    }

    // Get meal plans for specific date with full food info
    const { data: plans, error } = await supabase
      .from("meal_plans")
      .select(
        `
        *,
        foods!meal_plans_food_id_fkey (*)
      `
      )
      .eq("user_id", req.user.id)
      .eq("timestamp", formattedDate)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      timestamp: formatDateToDisplay(plan.timestamp),
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

    res.status(200).json({
      resultMessage: {
        en: "Get plans successfull",
        vn: "Lấy danh sách thành công",
      },
      resultCode: "00348",
      plans: formattedPlans,
    });
  } catch (err) {
    console.error("Error getting meal plans by date:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
