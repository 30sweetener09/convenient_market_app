// controllers/recipeController.js
import { supabase } from "../db.js";

export const createRecipe = async (req, res) => {
  try {
    const { foodName, name, htmlContent, description } = req.body;

    if (!foodName || !name || !htmlContent || !description) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing required fields",
          vn: "Thiếu thông tin bắt buộc",
        },
        resultCode: "400",
      });
    }

    // Find food by name
    const { data: food, error: foodError } = await supabase
      .from("foods")
      .select("*")
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

    // Insert recipe
    const { data, error } = await supabase
      .from("recipes")
      .insert([
        {
          name: name.trim(),
          description: description.trim(),
          html_content: htmlContent,
          food_id: food.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Add recipe successfull",
        vn: "Thêm công thức nấu ăn thành công",
      },
      resultCode: "00357",
      newRecipe: {
        id: data.id,
        name: data.name,
        description: data.description,
        htmlContent: data.html_content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        FoodId: data.food_id,
        "Food.id": food.id,
        "Food.name": food.name,
        "Food.imageUrl": food.image_url || food.imageUrl,
        "Food.type": food.type,
        "Food.createdAt": food.created_at,
        "Food.updatedAt": food.updated_at,
        "Food.FoodCategoryId": food.food_category_id || food.FoodCategoryId,
        "Food.UserId": food.user_id || food.UserId,
        "Food.UnitOfMeasurementId":
          food.unit_of_measurement_id || food.UnitOfMeasurementId,
      },
    });
  } catch (err) {
    console.error("Error creating recipe:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateRecipe = async (req, res) => {
  try {
    const { recipeId, newHtmlContent, newDescription, newFoodName, newName } =
      req.body;

    if (!recipeId) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing recipeId",
          vn: "Thiếu recipeId",
        },
        resultCode: "400",
      });
    }

    // Check if recipe exists
    const { data: existingRecipe, error: fetchError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (fetchError || !existingRecipe) {
      return res.status(404).json({
        resultMessage: {
          en: "Recipe not found",
          vn: "Không tìm thấy công thức",
        },
        resultCode: "404",
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

    if (newDescription !== undefined) {
      updateData.description = newDescription.trim();
    }

    if (newHtmlContent !== undefined) {
      updateData.html_content = newHtmlContent;
    }

    let foodData = null;
    if (newFoodName !== undefined) {
      const { data: food, error: foodError } = await supabase
        .from("foods")
        .select("*")
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
      foodData = food;
    }

    // Update recipe
    const { data, error } = await supabase
      .from("recipes")
      .update(updateData)
      .eq("id", recipeId)
      .select()
      .single();

    if (error) throw error;

    // Get food data if not already fetched
    if (!foodData) {
      const { data: food } = await supabase
        .from("foods")
        .select("*")
        .eq("id", data.food_id)
        .single();
      foodData = food;
    }

    res.status(200).json({
      resultMessage: {
        en: "Recipe updated successfully.",
        vn: "Cập nhật công thức nấu ăn thành công",
      },
      resultCode: "00370",
      recipe: {
        id: data.id,
        name: data.name,
        description: data.description,
        htmlContent: data.html_content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        FoodId: data.food_id,
        "Food.id": foodData?.id,
        "Food.name": foodData?.name,
        "Food.imageUrl": foodData?.image_url || foodData?.imageUrl,
        "Food.type": foodData?.type,
        "Food.createdAt": foodData?.created_at,
        "Food.updatedAt": foodData?.updated_at,
        "Food.FoodCategoryId":
          foodData?.food_category_id || foodData?.FoodCategoryId,
        "Food.UserId": foodData?.user_id || foodData?.UserId,
        "Food.UnitOfMeasurementId":
          foodData?.unit_of_measurement_id || foodData?.UnitOfMeasurementId,
      },
    });
  } catch (err) {
    console.error("Error updating recipe:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deleteRecipe = async (req, res) => {
  try {
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing recipeId",
          vn: "Thiếu recipeId",
        },
        resultCode: "400",
      });
    }

    const { data: existingRecipe, error: fetchError } = await supabase
      .from("recipes")
      .select("id")
      .eq("id", recipeId)
      .single();

    if (fetchError || !existingRecipe) {
      return res.status(404).json({
        resultMessage: {
          en: "Recipe not found",
          vn: "Không tìm thấy công thức",
        },
        resultCode: "404",
      });
    }

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Your recipe was deleted successfully.",
        vn: "Công thức của bạn đã được xóa thành công",
      },
      resultCode: "00376",
    });
  } catch (err) {
    console.error("Error deleting recipe:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getRecipesByFoodId = async (req, res) => {
  try {
    const { foodId } = req.query;

    if (!foodId) {
      return res.status(400).json({
        resultMessage: {
          en: "Missing foodId parameter",
          vn: "Thiếu tham số foodId",
        },
        resultCode: "400",
      });
    }

    // Get recipes for specific food with full food info
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select(
        `
        *,
        foods!recipes_food_id_fkey (*)
      `
      )
      .eq("food_id", foodId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formattedRecipes = recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      htmlContent: recipe.html_content,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
      FoodId: recipe.food_id,
      Food: recipe.foods
        ? {
            id: recipe.foods.id,
            name: recipe.foods.name,
            imageUrl: recipe.foods.image_url || recipe.foods.imageUrl,
            type: recipe.foods.type,
            createdAt: recipe.foods.created_at,
            updatedAt: recipe.foods.updated_at,
            FoodCategoryId:
              recipe.foods.food_category_id || recipe.foods.FoodCategoryId,
            UserId: recipe.foods.user_id || recipe.foods.UserId,
            UnitOfMeasurementId:
              recipe.foods.unit_of_measurement_id ||
              recipe.foods.UnitOfMeasurementId,
          }
        : null,
    }));

    res.status(200).json({
      resultMessage: {
        en: "Get recipes successfull",
        vn: "Lấy các công thức thành công",
      },
      resultCode: "00378",
      recipes: formattedRecipes,
    });
  } catch (err) {
    console.error("Error getting recipes by food id:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
