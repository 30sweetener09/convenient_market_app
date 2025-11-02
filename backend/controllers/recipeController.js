// controllers/recipeController.js
import { supabase } from "../db.js";

/**
 * @swagger
 * /api/recipes/create:
 *   post:
 *     summary: Create a new recipe
 *     description: Create a new recipe for a specific food item
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foodName
 *               - name
 *               - htmlContent
 *               - description
 *             properties:
 *               foodName:
 *                 type: string
 *                 description: Name of the food item
 *                 example: "Phở"
 *               name:
 *                 type: string
 *                 description: Name of the recipe
 *                 example: "Phở Bò Truyền Thống"
 *               htmlContent:
 *                 type: string
 *                 description: HTML content of the recipe instructions
 *                 example: "<h2>Nguyên liệu</h2><p>500g thịt bò...</p>"
 *               description:
 *                 type: string
 *                 description: Short description of the recipe
 *                 example: "Công thức phở bò truyền thống Hà Nội"
 *     responses:
 *       200:
 *         description: Recipe created successfully
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
 *                       example: "Add recipe successfull"
 *                     vn:
 *                       type: string
 *                       example: "Thêm công thức nấu ăn thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00357"
 *                 newRecipe:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     htmlContent:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     FoodId:
 *                       type: string
 *                     Food.id:
 *                       type: string
 *                     Food.name:
 *                       type: string
 *                     Food.imageUrl:
 *                       type: string
 *                     Food.type:
 *                       type: string
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Food not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/recipes/update:
 *   put:
 *     summary: Update an existing recipe
 *     description: Update recipe details including name, description, content, or associated food
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipeId
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: ID of the recipe to update
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               newName:
 *                 type: string
 *                 description: New name for the recipe
 *                 example: "Phở Bò Đặc Biệt"
 *               newDescription:
 *                 type: string
 *                 description: New description for the recipe
 *                 example: "Công thức phở bò đặc biệt với nhiều loại thịt"
 *               newHtmlContent:
 *                 type: string
 *                 description: New HTML content for recipe instructions
 *                 example: "<h2>Nguyên liệu</h2><p>Thịt bò, sườn...</p>"
 *               newFoodName:
 *                 type: string
 *                 description: New food name to associate with the recipe
 *                 example: "Phở Đặc Biệt"
 *     responses:
 *       200:
 *         description: Recipe updated successfully
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
 *                       example: "Recipe updated successfully."
 *                     vn:
 *                       type: string
 *                       example: "Cập nhật công thức nấu ăn thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00370"
 *                 recipe:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     htmlContent:
 *                       type: string
 *       400:
 *         description: Missing recipeId or invalid data
 *       404:
 *         description: Recipe or food not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/recipes/delete:
 *   delete:
 *     summary: Delete a recipe
 *     description: Delete a recipe by its ID
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipeId
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: ID of the recipe to delete
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
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
 *                       example: "Your recipe was deleted successfully."
 *                     vn:
 *                       type: string
 *                       example: "Công thức của bạn đã được xóa thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00376"
 *       400:
 *         description: Missing recipeId
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/recipes/get-by-food:
 *   get:
 *     summary: Get all recipes for a specific food
 *     description: Retrieve all recipes associated with a food item by food ID
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: foodId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the food item
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Recipes retrieved successfully
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
 *                       example: "Get recipes successfull"
 *                     vn:
 *                       type: string
 *                       example: "Lấy các công thức thành công"
 *                 resultCode:
 *                   type: string
 *                   example: "00378"
 *                 recipes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       htmlContent:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       FoodId:
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
 *         description: Missing foodId parameter
 *       500:
 *         description: Internal server error
 */
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
