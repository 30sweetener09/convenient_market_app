// controllers/recipeController.js
import { supabase } from "../db.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { uploadImageToSupabase } from "../services/uploadService.js";
import path from "path";
// kiểm tra hợp lệ text
const nameRegex = /^[a-zA-ZÀ-ỹ0-9 ]+$/;

/**
 * @swagger
 * /recipe:
 *   post:
 *     summary: Tạo công thức nấu ăn mới
 *     description: Tạo một công thức nấu ăn mới với thông tin chi tiết và có thể upload ảnh
 *     tags: [Recipe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - htmlContent
 *               - description
 *               - imageUrl
 *             properties:
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
 *               imageUrl:
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
    const { name, htmlContent, description } = req.body;
    const recipeImage = req.file;

    // Validation
    if (!name || !htmlContent || !description) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00349",
      });
    }

    if (!nameRegex.test(name) || name.length < 2 || name.length > 50) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid recipe name",
          vn: "Vui lòng cung cấp một tên công thức hợp lệ",
        },
        resultCode: "00351",
      });
    }

    if (typeof description !== "string" || description.trim() === "") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid recipe description",
          vn: "Vui lòng cung cấp một mô tả công thức hợp lệ",
        },
        resultCode: "00352",
      });
    }

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

    // Upload ảnh (nếu có)
    let imageData = null;
    if (recipeImage) {
      try {
        imageData = await uploadImageToSupabase(recipeImage);
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        return res.status(400).json({
          resultMessage: {
            en: "Error uploading image",
            vn: "Lỗi khi tải ảnh lên",
          },
          resultCode: "00355",
          error: uploadError.message,
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
          imageurl: imageData?.url || null,

          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
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
        imageUrl: recipeData.imageurl,
        createdAt: recipeData.createdat,
        updatedAt: recipeData.updatedat,
      },
    });
  } catch (err) {
    console.error("Error creating recipe:", err.message);
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
 * /recipe/{recipeId}:
 *   put:
 *     summary: Cập nhật công thức nấu ăn
 *     description: Cập nhật thông tin công thức nấu ăn, bao gồm cả ảnh. Có thể cập nhật một hoặc nhiều trường.
 *     tags: [Recipe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của công thức cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: ID công thức (có thể gửi qua body hoặc params)
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               newName:
 *                 type: string
 *                 description: Tên công thức mới (2-50 ký tự, tùy chọn)
 *                 example: "Bò xào rau củ nâng cao"
 *               newDescription:
 *                 type: string
 *                 description: Mô tả mới (tùy chọn)
 *                 example: "Món bò xào với công thức cải tiến"
 *               newHtmlContent:
 *                 type: string
 *                 description: Nội dung HTML mới (tùy chọn)
 *                 example: "<h2>Nguyên liệu</h2><ul><li>Thịt bò: 500g</li></ul>"
 *               recipeImage:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh công thức mới (tùy chọn, tối đa 5MB)
 *     responses:
 *       200:
 *         description: Cập nhật công thức thành công
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
 *                       example: "Recipe updated successfully"
 *                     vn:
 *                       type: string
 *                       example: "Cập nhật thành công"
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
 *                     imageUrl:
 *                       type: string
 *                       description: URL ảnh công thức (mới nếu đã cập nhật)
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
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
 *                   enum: ["00359", "00360", "00361", "00362", "00363", "00364", "00368"]
 *       404:
 *         description: Không tìm thấy công thức hoặc thực phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                 resultCode:
 *                   type: string
 *                   enum: ["00365", "00367"]
 *       500:
 *         description: Lỗi máy chủ
 */
export const updateRecipe = async (req, res) => {
  try {
    const { recipeId, newHtmlContent, newDescription, newName } = req.body;
    const imageFile = req.file; // Nhận file ảnh từ middleware (Multer)

    // 00359 - Kiểm tra trường bắt buộc (recipeId)
    if (!recipeId) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a recipe ID!",
          vn: "Vui lòng cung cấp một ID công thức!",
        },
        resultCode: "00359",
      });
    }

    // 00360 - Kiểm tra ít nhất một trường cần cập nhật (bao gồm cả ảnh)
    if (!newDescription && !newHtmlContent && !newName && !imageFile) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide at least one field to update",
          vn: "Vui lòng cung cấp ít nhất một trường để cập nhật",
        },
        resultCode: "00360",
      });
    }

    // 00362 - Validate Description (nếu có)
    if (
      newDescription !== undefined &&
      (typeof newDescription !== "string" || newDescription.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Invalid description",
          vn: "Mô tả không hợp lệ",
        },
        resultCode: "00362",
      });
    }

    // 00363 - Validate HTML Content (nếu có)
    if (newHtmlContent && newHtmlContent.trim() !== "") {
      const plainText = newHtmlContent
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
      const hasImage = /<img[^>]+src="([^">]+)"/g.test(newHtmlContent);
      if (
        typeof newHtmlContent !== "string" ||
        (plainText === "" && !hasImage)
      ) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid HTML content",
            vn: "Nội dung HTML không hợp lệ",
          },
          resultCode: "00363",
        });
      }
    }

    // 00364 - Validate Recipe Name (nếu có)
    if (newName && newName.trim() !== "") {
      if (
        !nameRegex.test(newName) ||
        newName.length < 2 ||
        newName.length > 50
      ) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid recipe name",
            vn: "Tên công thức không hợp lệ",
          },
          resultCode: "00364",
        });
      }
    }

    // 00365 - Kiểm tra công thức tồn tại
    const { data: existingRecipe, error: fetchError } = await supabase
      .from("recipe")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (fetchError || !existingRecipe) {
      return res.status(404).json({
        resultMessage: {
          en: "Recipe not found",
          vn: "Không tìm thấy công thức",
        },
        resultCode: "00365",
      });
    }

    // Build Update Object
    const updateData = { updatedat: new Date().toISOString() };
    if (newName) updateData.name = newName.trim();
    if (newDescription) updateData.description = newDescription.trim();
    if (newHtmlContent) updateData.htmlcontent = newHtmlContent.trim();

    // Xử lý Upload ảnh lên Supabase Storage nếu có file mới
    if (imageFile) {
      try {
        imageData = await uploadImageToSupabase(recipeImage);
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        return res.status(400).json({
          resultMessage: {
            en: "Error uploading image",
            vn: "Lỗi khi tải ảnh lên",
          },
          resultCode: "00355",
          error: uploadError.message,
        });
      }
    }

    // Thực hiện Update
    const { data: updatedRecipe, error: updateError } = await supabase
      .from("recipe")
      .update(updateData)
      .eq("id", recipeId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 00370 - Cập nhật thành công
    res.status(200).json({
      resultMessage: {
        en: "Recipe updated successfully",
        vn: "Cập nhật thành công",
      },
      resultCode: "00370",
      recipe: {
        id: updatedRecipe.id,
        name: updatedRecipe.name,
        description: updatedRecipe.description,
        htmlContent: updatedRecipe.htmlcontent,
        imageUrl: updatedRecipe.imageData, // Trả về URL ảnh mới (nếu có)
        createdAt: updatedRecipe.createdat,
        updatedAt: updatedRecipe.updatedat,
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
 * /recipe/{recipeId}:
 *   delete:
 *     summary: Delete a recipe
 *     description: Delete a recipe by its ID.
 *     tags:
 *       - Recipe
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
 *                 type: integer
 *                 description: ID of the recipe to delete
 *                 example: 1
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
 *                       example: Your recipe was deleted successfully
 *                     vn:
 *                       type: string
 *                       example: Công thức của bạn đã được xóa thành công
 *                 resultCode:
 *                   type: string
 *                   example: "00376"
 *       400:
 *         description: Invalid or missing recipe ID
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
 *                       example: Please provide all required fields
 *                     vn:
 *                       type: string
 *                       example: Vui lòng cung cấp tất cả các trường bắt buộc
 *                 resultCode:
 *                   type: string
 *                   example: "00371"
 *       404:
 *         description: Recipe not found
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
 *                       example: Recipe not found with the provided ID
 *                     vn:
 *                       type: string
 *                       example: Không tìm thấy công thức với ID đã cung cấp
 *                 resultCode:
 *                   type: string
 *                   example: "00373"
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
 *                       example: Internal server error
 *                     vn:
 *                       type: string
 *                       example: Lỗi máy chủ nội bộ
 *                 resultCode:
 *                   type: string
 *                   example: "00500"
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
    if (
      (typeof recipeId !== "string" && typeof recipeId !== "number") ||
      (typeof recipeId === "string" && recipeId.trim() === "") ||
      recipeId === null ||
      recipeId === undefined
    ) {
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
      .from("recipe")
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
      .from("recipe")
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
 * /recipe:
 *   get:
 *     tags:
 *       - Recipes
 *     summary: Get all recipes
 *     description: Retrieve all recipes sorted by creation date (newest first)
 *     security:
 *       - bearerAuth: []
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
 *                   example: "00379"
 *                 recipe:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   resultMessage:
 *                     en: "Get recipes successfull"
 *                     vn: "Lấy các công thức thành công"
 *                   resultCode: "00379"
 *                   recipe:
 *                     - id: 1
 *                       name: "Phở Bò Hà Nội"
 *                       description: "Món phở truyền thống của Việt Nam"
 *                       htmlContent: "<p>Nguyên liệu...</p>"
 *                       imageUrl: "https://example.com/image.jpg"
 *                       createdAt: "2024-01-03T10:30:00.000Z"
 *                       updatedAt: "2024-01-03T10:30:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
export const getAllRecipes = async (req, res) => {
  try {
    const { data: recipes, error } = await supabase
      .from("recipe")
      .select("*")
      .order("createdat", { ascending: false });

    if (error) throw error;

    const formattedRecipe = recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      htmlContent: recipe.htmlcontent,
      imageurl: recipe.imageurl,
      createdAt: recipe.createdat,
      updatedAt: recipe.updatedat,
    }));

    res.status(200).json({
      resultMessage: {
        en: "Get recipes successfull",
        vn: "Lấy các công thức thành công",
      },
      resultCode: "00379",
      recipe: formattedRecipe,
    });
  } catch (err) {
    console.error("Error getting all recipes:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

/**
 * @swagger
 * /recipe/{recipeId}:
 *   get:
 *     summary: Get recipe by ID
 *     description: Retrieve detailed information of a specific recipe by its ID, including full food information.
 *     tags:
 *       - Recipe
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the recipe
 *     responses:
 *       200:
 *         description: Get recipe detail successfully
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
 *                       example: Get recipe detail successfully
 *                     vn:
 *                       type: string
 *                       example: Lấy chi tiết công thức thành công
 *                 resultCode:
 *                   type: string
 *                   example: "00379"
 *                 recipe:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     htmlContent:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                       description: URL ảnh công thức
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *
 *       400:
 *         description: Invalid recipe ID
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Internal server error
 */
export const getRecipeById = async (req, res) => {
  try {
    const { recipeId } = req.params;

    // 00371 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (!recipeId) {
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
      (typeof recipeId !== "string" && typeof recipeId !== "number") ||
      (typeof recipeId === "string" && recipeId.trim() === "")
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid recipe ID",
          vn: "Vui lòng cung cấp một ID công thức hợp lệ",
        },
        resultCode: "00381",
      });
    }

    // Lấy recipe theo ID
    const { data: recipe, error } = await supabase
      .from("recipe")
      .select("*")
      .eq("id", recipeId)
      .single();

    // 00373 - Không tìm thấy công thức
    if (error || !recipe) {
      return res.status(404).json({
        resultMessage: {
          en: "Recipe not found with the provided ID",
          vn: "Không tìm thấy công thức với ID đã cung cấp",
        },
        resultCode: "00382",
      });
    }

    const formattedRecipe = {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      htmlContent: recipe.htmlcontent,
      createdAt: recipe.createdat,
      updatedAt: recipe.updatedat,
    };

    res.status(200).json({
      resultMessage: {
        en: "Get recipe detail successfully",
        vn: "Lấy chi tiết công thức thành công",
      },
      resultCode: "00379",
      recipe: formattedRecipe,
    });
  } catch (err) {
    console.error("Error getting recipe by id:", err.message);
    res.status(500).json({
      resultMessage: {
        en: "Internal server error",
        vn: "Lỗi máy chủ nội bộ",
      },
      resultCode: "00500",
    });
  }
};

/**
 * @swagger
 * /recipe/search:
 *   get:
 *     summary: Search recipes by name
 *     description: Search recipes by name keyword and return matching recipes with full food information.
 *     tags:
 *       - Recipe
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Keyword to search recipe name
 *         example: chicken
 *     responses:
 *       200:
 *         description: Search recipes successfully
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
 *                       example: Search recipes successfully
 *                     vn:
 *                       type: string
 *                       example: Tìm kiếm công thức thành công
 *                 resultCode:
 *                   type: string
 *                   example: "00380"
 *                 recipes:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing or invalid search keyword
 *       500:
 *         description: Internal server error
 */
export const searchRecipesByName = async (req, res) => {
  try {
    const { name } = req.query;

    // 00371 - Vui lòng cung cấp tất cả các trường bắt buộc
    if (!name) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide all required fields",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc",
        },
        resultCode: "00371",
      });
    }

    // 00372 - Từ khóa tìm kiếm không hợp lệ
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide a valid search keyword",
          vn: "Vui lòng cung cấp từ khóa tìm kiếm hợp lệ",
        },
        resultCode: "00372",
      });
    }

    // Tìm recipe theo tên
    const { data: recipes, error } = await supabase
      .from("recipe")
      .select("*")
      .ilike("name", `%${name}%`)
      .order("createdat", { ascending: false });

    if (error) throw error;

    const formattedRecipes = recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      htmlContent: recipe.htmlcontent,
      createdAt: recipe.createdat,
      updatedAt: recipe.updatedat,
    }));

    res.status(200).json({
      resultMessage: {
        en: "Search recipes successfully",
        vn: "Tìm kiếm công thức thành công",
      },
      resultCode: "00380",
      recipes: formattedRecipes,
    });
  } catch (err) {
    console.error("Error searching recipes:", err.message);
    res.status(500).json({
      resultMessage: {
        en: "Internal server error",
        vn: "Lỗi máy chủ nội bộ",
      },
      resultCode: "00500",
    });
  }
};
