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
 * /recipe:
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
 * /recipe:
 *   put:
 *     summary: Cập nhật công thức nấu ăn
 *     description: Cập nhật thông tin công thức nấu ăn, bao gồm cả ảnh. Có thể cập nhật một hoặc nhiều trường.
 *     tags: [Recipes]
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
 *               newFoodName:
 *                 type: string
 *                 description: Tên thực phẩm mới (2-50 ký tự, tùy chọn)
 *                 example: "Thịt bò Úc"
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
    const { recipeId, newHtmlContent, newDescription, newFoodName, newName } =
      req.body;
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
    if (
      !newFoodName &&
      !newDescription &&
      !newHtmlContent &&
      !newName &&
      !imageFile
    ) {
      return res.status(400).json({
        resultMessage: {
          en: "Please provide at least one field to update",
          vn: "Vui lòng cung cấp ít nhất một trường để cập nhật",
        },
        resultCode: "00360",
      });
    }

    // 00361 - Validate Food Name (nếu có)
    if (newFoodName && newFoodName.trim() !== "") {
      if (
        !nameRegex.test(newFoodName) ||
        newFoodName.length < 2 ||
        newFoodName.length > 50
      ) {
        return res.status(400).json({
          resultMessage: {
            en: "Invalid food name",
            vn: "Tên thực phẩm không hợp lệ",
          },
          resultCode: "00361",
        });
      }
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
        // Xóa ảnh cũ nếu có (tùy chọn)
        if (existingRecipe.imageurl) {
          try {
            // Extract file path from old URL
            const oldUrl = existingRecipe.imageurl;
            const urlParts = oldUrl.split("/recipe-images/");
            if (urlParts.length > 1) {
              const oldFilePath = urlParts[1].split("?")[0]; // Remove query params

              // Xóa file cũ
              await supabase.storage
                .from("recipe-images")
                .remove([`recipes/${oldFilePath}`]);
            }
          } catch (deleteErr) {
            console.warn("Could not delete old image:", deleteErr.message);
            // Không throw error, tiếp tục upload ảnh mới
          }
        }

        // Tạo tên file unique
        const fileExt = path.extname(imageFile.originalname);
        const fileName = `${uuidv4()}${fileExt}`;
        const filePath = `recipes/${fileName}`;

        // Upload file mới lên Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("recipe-images")
          .upload(filePath, imageFile.buffer, {
            contentType: imageFile.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // 00368 - Lỗi khi tải ảnh lên
          return res.status(400).json({
            resultMessage: {
              en: "Error uploading image",
              vn: "Lỗi khi tải ảnh lên",
            },
            resultCode: "00368",
            error: uploadError.message,
          });
        }

        // Lấy public URL của ảnh mới
        const { data: publicUrlData } = supabase.storage
          .from("recipe-images")
          .getPublicUrl(filePath);

        updateData.imageurl = publicUrlData.publicUrl;
      } catch (uploadErr) {
        console.error("Upload exception:", uploadErr);
        return res.status(400).json({
          resultMessage: {
            en: "Error uploading image",
            vn: "Lỗi khi tải ảnh lên",
          },
          resultCode: "00368",
          error: uploadErr.message,
        });
      }
    }
    console.log(newFoodName.trim() !== "");
    // 00367 - Xử lý Food Name (nếu có)
    let foodData = null;
    if (newFoodName && newFoodName.trim() !== "") {
      const { data: food, error: foodError } = await supabase
        .from("food")
        .select("*")
        .eq("name", newFoodName.trim())
        .single();

      console.log(food);

      if (foodError || !food) {
        return res.status(404).json({
          resultMessage: {
            en: "Food not found",
            vn: "Thực phẩm không tồn tại",
          },
          resultCode: "00367",
        });
      }
      updateData.foodid = food.id;
      foodData = food;
    }

    // Thực hiện Update
    const { data: updatedRecipe, error: updateError } = await supabase
      .from("recipe")
      .update(updateData)
      .eq("id", recipeId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Lấy thông tin Food nếu chưa có
    if (!foodData) {
      const { data: food } = await supabase
        .from("food")
        .select("*")
        .eq("id", updatedRecipe.foodid)
        .single();
      foodData = food;
    }

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
        imageUrl: updatedRecipe.imageurl, // Trả về URL ảnh mới (nếu có)
        createdAt: updatedRecipe.createdat,
        updatedAt: updatedRecipe.updatedat,
        FoodId: updatedRecipe.foodid,
        Food: foodData
          ? {
              id: foodData.id,
              name: foodData.name,
              imageUrl: foodData.imageurl,
              type: foodData.type,
              FoodCategoryId: foodData.foodcategoryid,
              UserId: foodData.userid,
              UnitOfMeasurementId: foodData.unitofmeasurementid,
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
 * /recipe/delete:
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
 * /recipe/byFoodId:
 *   get:
 *     summary: Get recipes by food ID
 *     description: Retrieve all recipes associated with a specific food ID, including full food information.
 *     tags:
 *       - Recipe
 *     parameters:
 *       - in: query
 *         name: foodId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the food
 *     responses:
 *       200:
 *         description: Get recipes successfully
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
 *                       example: Get recipes successfull
 *                     vn:
 *                       type: string
 *                       example: Lấy các công thức thành công
 *                 resultCode:
 *                   type: string
 *                   example: "00378"
 *                 recipes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
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
 *                         type: integer
 *                       Food:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                           type:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           FoodCategoryId:
 *                             type: integer
 *                           UserId:
 *                             type: integer
 *                           UnitOfMeasurementId:
 *                             type: integer
 *       400:
 *         description: Recipe not found with the provided ID
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
 *                       example: recipe not found with the provided ID
 *                     vn:
 *                       type: string
 *                       example: Không tìm thấy công thức với ID đã cung cấp
 *                 resultCode:
 *                   type: string
 *                   example: "00376"
 *       500:
 *         description: Internal server error
 */

export const getRecipesByFoodId = async (req, res) => {
  try {
    const { foodId } = req.query;

    const { data: food, error: foodError } = await supabase
      .from("food")
      .select("*")
      .eq("id", foodId)
      .single();

    if (!food || foodError) {
      return res.status(400).json({
        resultMessage: {
          en: "recipe not found with the provided ID",
          vn: "Không tìm thấy công thức với ID đã cung cấp",
        },
        resultCode: "00376",
      });
    }

    // Get recipes for specific food with full food info
    const { data: recipes, error } = await supabase
      .from("recipe")
      .select(
        `
        *,
        food:foodid (*) 
      `
      )
      .eq("foodid", foodId)
      .order("createdat", { ascending: false });

    if (error) throw error;

    const formattedRecipes = recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      htmlContent: recipe.htmlcontent,
      createdAt: recipe.createdat,
      updatedAt: recipe.updatedat,
      FoodId: recipe.foodid,
      Food: recipe.food
        ? {
            id: recipe.food.id,
            name: recipe.food.name,
            imageUrl: recipe.food.imageurl,
            type: recipe.food.type,
            createdAt: recipe.food.createdat,
            updatedAt: recipe.food.updatedat,
            FoodCategoryId: recipe.food.foodcategoryid,
            UserId: recipe.food.userid,
            UnitOfMeasurementId: recipe.food.unitofmeasurementid,
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

/**
 * @swagger
 * /recipe:
 *   get:
 *     summary: Get all recipes
 *     description: Retrieve all recipes with full food information, ordered by creation date.
 *     tags:
 *       - Recipe
 *     responses:
 *       200:
 *         description: Get all recipes successfully
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
 *                       example: Get recipes successfull
 *                     vn:
 *                       type: string
 *                       example: Lấy các công thức thành công
 *                 resultCode:
 *                   type: string
 *                   example: "00378"
 *                 recipes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
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
 *                         type: integer
 *                       Food:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                           type:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           FoodCategoryId:
 *                             type: integer
 *                           UserId:
 *                             type: integer
 *                           UnitOfMeasurementId:
 *                             type: integer
 *       500:
 *         description: Internal server error
 */
export const getAllRecipes = async (req, res) => {
  try {
    const { data: recipes, error } = await supabase
      .from("recipe")
      .select(
        `
        *,
        food:foodid (*)
      `
      )
      .order("createdat", { ascending: false });

    if (error) throw error;

    const formattedRecipes = recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      htmlContent: recipe.htmlcontent,
      createdAt: recipe.createdat,
      updatedAt: recipe.updatedat,
      FoodId: recipe.foodid,
      Food: recipe.food
        ? {
            id: recipe.food.id,
            name: recipe.food.name,
            imageUrl: recipe.food.imageurl,
            type: recipe.food.type,
            createdAt: recipe.food.createdat,
            updatedAt: recipe.food.updatedat,
            FoodCategoryId: recipe.food.foodcategoryid,
            UserId: recipe.food.userid,
            UnitOfMeasurementId: recipe.food.unitofmeasurementid,
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
    console.error("Error getting all recipes:", err.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
