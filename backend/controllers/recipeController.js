// controllers/recipeController.js
import { supabase } from "../db.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
// kiểm tra hợp lệ text
const nameRegex = /^[a-zA-ZÀ-ỹ0-9 ]+$/;

// Cấu hình multer để xử lý upload file
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)"));
    }
  },
});

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Tạo công thức nấu ăn mới
 *     description: Tạo một công thức nấu ăn mới với thông tin chi tiết và có thể upload ảnh
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *                 description: Tên thực phẩm (2-50 ký tự)
 *                 example: "Thịt bò"
 *               name:
 *                 type: string
 *                 description: Tên công thức (2-50 ký tự)
 *                 example: "Bò xào rau củ"
 *               description:
 *                 type: string
 *                 description: Mô tả công thức
 *                 example: "Món bò xào rau củ thơm ngon, bổ dưỡng"
 *               htmlContent:
 *                 type: string
 *                 description: Nội dung HTML của công thức
 *                 example: "<h2>Nguyên liệu</h2><ul><li>Thịt bò: 300g</li></ul>"
 *               recipeImage:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh công thức (tùy chọn, tối đa 5MB, định dạng jpeg/jpg/png/gif/webp)
 *     responses:
 *       200:
 *         description: Thêm công thức thành công
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
 *                       example: "Recipe added successfully"
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
 *                     imageUrl:
 *                       type: string
 *                       description: URL ảnh công thức (nếu có)
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     FoodId:
 *                       type: string
 *                     Food:
 *                       type: object
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                 resultCode:
 *                   type: string
 *                   enum: ["00349", "00350", "00351", "00352", "00353", "00355"]
 *       404:
 *         description: Không tìm thấy thực phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                 resultCode:
 *                   type: string
 *                   example: "00354"
 *       500:
 *         description: Lỗi máy chủ
 */
export const createRecipe = async (req, res) => {
  try {
    const { foodName, name, htmlContent, description } = req.body;
    const recipeImage = req.file; // File ảnh từ multer

    // 00349 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (!foodName || !name || !htmlContent || !description) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00349",
      });
    }

    // 00350 - Vui lòng cung cấp một tên thực phẩm hợp lệ
    if (
      !nameRegex.test(foodName) ||
      foodName.length < 2 ||
      foodName.length > 50
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid food name",
          vn: "Vui lòng cung cấp một tên thực phẩm hợp lệ",
        },
        resultCode: "00350",
      });
    }

    // 00351 - Vui lòng cung cấp một tên công thức hợp lệ
    if (!nameRegex.test(name) || name.length < 2 || name.length > 50) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid recipe name",
          vn: "Vui lòng cung cấp một tên công thức hợp lệ",
        },
        resultCode: "00351",
      });
    }

    // 00352 - Vui lòng cung cấp một mô tả công thức hợp lệ
    if (typeof description !== "string" || description.trim() === "") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid recipe description",
          vn: "Vui lòng cung cấp một mô tả công thức hợp lệ",
        },
        resultCode: "00352",
      });
    }

    // 00353 - Vui lòng cung cấp nội dung HTML công thức hợp lệ
    const plainText = htmlContent
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    const hasImage = /<img[^>]+src="([^">]+)"/g.test(htmlContent);

    if (typeof htmlContent !== "string" || (plainText === "" && !hasImage)) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide valid recipe HTML content",
          vn: "Vui lòng cung cấp nội dung HTML công thức hợp lệ",
        },
        resultCode: "00353",
      });
    }

    // 00354 - Không tìm thấy thực phẩm với tên đã cung cấp
    const { data: food, error: foodError } = await supabase
      .from("food")
      .select("*")
      .eq("name", foodName.trim())
      .single();

    if (foodError || !food) {
      return res.status(404).json({
        resultMessage: {
          en: "Food not found with the provided name",
          vn: "Không tìm thấy thực phẩm với tên đã cung cấp",
        },
        resultCode: "00354",
      });
    }

    // Upload ảnh lên Supabase Storage (nếu có)
    let imageUrl = null;

    if (recipeImage) {
      try {
        // Tạo tên file unique
        const fileExt = path.extname(recipeImage.originalname);
        const fileName = `${uuidv4()}${fileExt}`;
        const filePath = `recipes/${fileName}`;

        // Upload file lên Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("recipe-images") // Tên bucket trong Supabase Storage
          .upload(filePath, recipeImage.buffer, {
            contentType: recipeImage.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // 00355 - Lỗi khi tải ảnh lên
          return res.status(400).json({
            resultMessage: {
              en: "Error uploading image",
              vn: "Lỗi khi tải ảnh lên",
            },
            resultCode: "00355",
            error: uploadError.message,
          });
        }

        // Lấy public URL của ảnh
        const { data: publicUrlData } = supabase.storage
          .from("recipe-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      } catch (uploadErr) {
        console.error("Upload exception:", uploadErr);
        return res.status(400).json({
          resultMessage: {
            en: "Error uploading image",
            vn: "Lỗi khi tải ảnh lên",
          },
          resultCode: "00355",
          error: uploadErr.message,
        });
      }
    }

    // Insert recipe
    const { data: recipeData, error: insertError } = await supabase
      .from("recipe")
      .insert([
        {
          name: name.trim(),
          description: description.trim(),
          htmlcontent: htmlContent.trim(),
          imageurl: imageUrl, // Thêm URL ảnh vào database
          foodid: food.id,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // 00357 - Thêm công thức nấu ăn thành công
    res.status(200).json({
      resultMessage: {
        en: "Recipe added successfully",
        vn: "Thêm công thức nấu ăn thành công",
      },
      resultCode: "00357",
      newRecipe: {
        id: recipeData.id,
        name: recipeData.name,
        description: recipeData.description,
        htmlContent: recipeData.htmlcontent,
        imageUrl: recipeData.imageurl, // Trả về URL ảnh
        createdAt: recipeData.createdat,
        updatedAt: recipeData.updatedat,
        FoodId: recipeData.foodid,
        Food: {
          id: food.id,
          name: food.name,
          imageUrl: food.imageurl,
          type: food.type,
          createdAt: food.createdat,
          updatedAt: food.updatedat,
          FoodCategoryId: food.foodcategoryid,
          UserId: food.userid,
          UnitOfMeasurementId: food.unitofmeasurementid,
        },
      },
    });
  } catch (err) {
    console.error("Error creating recipe:", err.message);
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

// Export middleware upload để sử dụng trong route
export const uploadRecipeImage = upload.single("recipeImage");

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

    // 00358 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (
      !recipeId &&
      newHtmlContent === undefined &&
      newDescription === undefined &&
      newFoodName === undefined &&
      newName === undefined
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00358",
      });
    }

    // 00359 - Vui lòng cung cấp một ID công thức!
    if (!recipeId || (typeof recipeId === "string" && recipeId.trim() === "")) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a recipe ID!",
          vn: "Vui lòng cung cấp một ID công thức!",
        },
        resultCode: "00359",
      });
    }

    // 00360 - Vui lòng cung cấp ít nhất một trong các trường sau
    if (
      newFoodName === undefined &&
      newDescription === undefined &&
      newHtmlContent === undefined &&
      newName === undefined
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide at least one of the following fields: newFoodName, newDescription, newHtmlContent, newName",
          vn: "Vui lòng cung cấp ít nhất một trong các trường sau, newFoodName, newDescription, newHtmlContent, newName",
        },
        resultCode: "00360",
      });
    }

    // 00361 - Vui lòng cung cấp một tên thực phẩm mới hợp lệ!
    if (
      newFoodName !== undefined &&
      (typeof newFoodName !== "string" || newFoodName.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid new food name!",
          vn: "Vui lòng cung cấp một tên thực phẩm mới hợp lệ!",
        },
        resultCode: "00361",
      });
    }

    // 00362 - Vui lòng cung cấp một mô tả mới hợp lệ!
    if (
      newDescription !== undefined &&
      (typeof newDescription !== "string" || newDescription.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid new description!",
          vn: "Vui lòng cung cấp một mô tả mới hợp lệ!",
        },
        resultCode: "00362",
      });
    }

    // 00363 - Vui lòng cung cấp nội dung HTML mới hợp lệ!
    if (
      newHtmlContent !== undefined &&
      (typeof newHtmlContent !== "string" || newHtmlContent.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide valid new HTML content!",
          vn: "Vui lòng cung cấp nội dung HTML mới hợp lệ!",
        },
        resultCode: "00363",
      });
    }

    // 00364 - Vui lòng cung cấp một tên công thức mới hợp lệ!
    if (
      newName !== undefined &&
      (typeof newName !== "string" || newName.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid new recipe name!",
          vn: "Vui lòng cung cấp một tên công thức mới hợp lệ!",
        },
        resultCode: "00364",
      });
    }

    // 00365 - Không tìm thấy công thức với ID đã cung cấp
    const { data: existingRecipe, error: fetchError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (fetchError || !existingRecipe) {
      return res.status(404).json({
        resultMessage: {
          en: "Recipe not found with the provided ID",
          vn: "Không tìm thấy công thức với ID đã cung cấp",
        },
        resultCode: "00365",
      });
    }

    // Build update object
    const updateData = { updated_at: new Date().toISOString() };

    // Xử lý newName
    if (newName !== undefined) {
      updateData.name = newName.trim();
    }

    // Xử lý newDescription
    if (newDescription !== undefined) {
      updateData.description = newDescription.trim();
    }

    // Xử lý newHtmlContent
    if (newHtmlContent !== undefined) {
      updateData.html_content = newHtmlContent.trim();
    }

    // Xử lý newFoodName
    let foodData = null;
    if (newFoodName !== undefined) {
      // 00367 - Tên thực phẩm mới không tồn tại
      const { data: food, error: foodError } = await supabase
        .from("foods")
        .select("*")
        .ilike("name", newFoodName.trim())
        .single();

      if (foodError || !food) {
        return res.status(404).json({
          resultMessage: {
            en: "New food name does not exist",
            vn: "Tên thực phẩm mới không tồn tại",
          },
          resultCode: "00367",
        });
      }

      updateData.food_id = food.id;
      foodData = food;
    }

    // Update recipe
    const { data: updatedRecipe, error: updateError } = await supabase
      .from("recipes")
      .update(updateData)
      .eq("id", recipeId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Get food data if not already fetched
    if (!foodData) {
      const { data: food } = await supabase
        .from("foods")
        .select("*")
        .eq("id", updatedRecipe.food_id)
        .single();
      foodData = food;
    }

    // 00370 - Cập nhật công thức nấu ăn thành công
    res.status(200).json({
      resultMessage: {
        en: "Recipe updated successfully",
        vn: "Cập nhật công thức nấu ăn thành công",
      },
      resultCode: "00370",
      recipe: {
        id: updatedRecipe.id,
        name: updatedRecipe.name,
        description: updatedRecipe.description,
        htmlContent: updatedRecipe.html_content,
        createdAt: updatedRecipe.created_at,
        updatedAt: updatedRecipe.updated_at,
        FoodId: updatedRecipe.food_id,
        Food: foodData
          ? {
              id: foodData.id,
              name: foodData.name,
              imageUrl: foodData.image_url || foodData.imageUrl,
              type: foodData.type,
              createdAt: foodData.created_at,
              updatedAt: foodData.updated_at,
              FoodCategoryId:
                foodData.food_category_id || foodData.FoodCategoryId,
              UserId: foodData.user_id || foodData.UserId,
              UnitOfMeasurementId:
                foodData.unit_of_measurement_id || foodData.UnitOfMeasurementId,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("Error updating recipe:", err.message);
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

    // 00371 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (!recipeId) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00371",
      });
    }

    // 00372 - Vui lòng cung cấp một ID công thức hợp lệ
    if (typeof recipeId !== "string" && typeof recipeId !== "number") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid recipe ID",
          vn: "Vui lòng cung cấp một ID công thức hợp lệ",
        },
        resultCode: "00372",
      });
    }

    if (typeof recipeId === "string" && recipeId.trim() === "") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid recipe ID",
          vn: "Vui lòng cung cấp một ID công thức hợp lệ",
        },
        resultCode: "00372",
      });
    }

    // 00373 - Không tìm thấy công thức với ID đã cung cấp
    const { data: existingRecipe, error: fetchError } = await supabase
      .from("recipes")
      .select("id")
      .eq("id", recipeId)
      .single();

    if (fetchError || !existingRecipe) {
      return res.status(404).json({
        resultMessage: {
          en: "Recipe not found with the provided ID",
          vn: "Không tìm thấy công thức với ID đã cung cấp",
        },
        resultCode: "00373",
      });
    }

    // Xóa recipe
    const { error: deleteError } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);

    if (deleteError) throw deleteError;

    // 00376 - Công thức của bạn đã được xóa thành công
    res.status(200).json({
      resultMessage: {
        en: "Your recipe was deleted successfully",
        vn: "Công thức của bạn đã được xóa thành công",
      },
      resultCode: "00376",
    });
  } catch (err) {
    console.error("Error deleting recipe:", err.message);
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
          en: "ecipe not found with the provided ID",
          vn: "Không tìm thấy công thức với ID đã cung cấp",
        },
        resultCode: "00376",
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
