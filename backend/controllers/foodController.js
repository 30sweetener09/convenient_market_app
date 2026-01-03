// controllers/foodController.js
import { supabase } from "../db.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { uploadImageToSupabase } from "../services/uploadService.js";
import path from "path";
// kiểm tra hợp lệ text
const nameRegex = /^[a-zA-ZÀ-ỹ0-9 ]+$/;

export const createFood = async (req, res) => {
  try {
    const { name, foodCategoryName, unitName, type } = req.body;
    const user = req.user;

    if (!name || !foodCategoryName || !unitName || !req.file) {
      return res.status(200).json({
        resultMessage: {
          en: "Please provide all required fields!",
          vn: "Vui lòng cung cấp tất cả các trường bắt buộc!",
        },
        resultCode: "00147",
      });
    }

    // 2. TYPE
    let finalType = "Ingredient";
    if (type && type.trim().toLowerCase() === "meal") {
      finalType = "Meal";
    }

    // 4. FIND CATEGORY
    const { data: category } = await supabase
      .from("foodcategory")
      .select("id")
      .ilike("name", foodCategoryName.trim())
      .maybeSingle();

    if (!category) {
      return res.status(200).json({
        resultMessage: {
          en: "Category not found",
          vn: "Không tìm thấy category với tên cung cấp",
        },
        resultCode: "00155",
      });
    }

    // 5. FIND UNIT
    const { data: unit } = await supabase
      .from("unitofmeasurement")
      .select("id")
      .ilike("unitname", unitName.trim())
      .maybeSingle();

    if (!unit) {
      return res.status(200).json({
        resultMessage: {
          en: "Unit not found",
          vn: "Không tìm thấy đơn vị với tên cung cấp",
        },
        resultCode: "00153",
      });
    }

    // 6. UPLOAD IMAGE
    const imageUrl = await uploadImage(req.file);
    if (!imageUrl) {
      return res.status(200).json({
        resultMessage: {
          en: "Image upload failed",
          vn: "Đăng tải ảnh thất bại",
        },
        resultCode: "00158",
      });
    }

    // 7. INSERT
    const { data, error } = await supabase
      .from("food")
      .insert({
        name: name.trim(),
        imageurl: imageUrl,
        type: finalType,
        foodcategoryid: category.id,
        unitofmeasurementid: unit.id,
        userid: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      resultMessage: {
        en: "Food creation successful",
        vn: "Tạo thực phẩm thành công",
      },
      resultCode: "00160",
      newFood: data,
    });
  } catch (err) {
    console.error("Create Food API Error:", err);
    return res.status(500).json({
      resultMessage: { en: "Internal Server Error", vn: "server error" },
      resultCode: "00152",
    });
  }
};

/**
 * @swagger
 * /food:
 *   put:
 *     summary: Update food information
 *     description: |
 *       Update food information such as name, category, unit, and image.
 *       User must be authenticated.
 *       At least one field must be provided to update.
 *     tags:
 *       - Food
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - foodid
 *               - name
 *             properties:
 *               foodid:
 *                 type: string
 *                 example: "f123456"
 *               name:
 *                 type: string
 *                 example: "Boiled Egg"
 *               foodCategoryName:
 *                 type: string
 *                 example: "Protein"
 *               unitName:
 *                 type: string
 *                 example: "Gram"
 *               type:
 *                 type: string
 *                 example: "raw"
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Update food successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00178"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Successfully"
 *                     vn:
 *                       type: string
 *                       example: "Thành công"
 *                 food:
 *                   type: object
 *                   description: Updated food object
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00400"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Food or related resource not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   oneOf:
 *                     - example: "00167"
 *                     - example: "00171"
 *                     - example: "00169"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                     vn:
 *                       type: string
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00168"
 */

export const updateFood = async (req, res) => {
  try {
    const { foodid, name, foodCategoryName, unitName, type } = req.body;
    const user = req.user;
    const image = req.file;
    // 1. VALIDATION NAME
    if (!name) {
      return res.status(200).json({
        resultMessage: {
          en: "Please provide valid food name!",
          vn: "Vui lòng cung cấp tên thực phẩm hợp lệ!",
        },
        resultCode: "00162",
      });
    }

    // 2. CHECK UPDATE FIELDS
    if (!name && !foodCategoryName && !unitName && image) {
      return res.status(200).json({
        resultMessage: {
          en: "Please provide at least one field to update",
          vn: "Vui lòng cung cấp ít nhất một trường để cập nhật",
        },
        resultCode: "00163",
      });
    }

    // 3. FIND FOOD
    const { data: existing } = await supabase
      .from("food")
      .select("*")
      .eq("id", foodid)
      .maybeSingle();

    if (!existing) {
      return res.status(200).json({
        resultMessage: {
          en: "Food not found",
          vn: "Thực phẩm với id đã cung cấp không tồn tại",
        },
        resultCode: "00167",
      });
    }

    const updateData = { updatedat: new Date().toISOString() };

    // 5. CATEGORY
    if (foodCategoryName) {
      const { data: cat } = await supabase
        .from("foodcategory")
        .select("id")
        .ilike("name", foodCategoryName.trim())
        .maybeSingle();

      if (!cat) {
        return res.status(200).json({
          resultMessage: {
            en: "Category not found",
            vn: "Không tìm thấy danh mục",
          },
          resultCode: "00171",
        });
      }
      updateData.foodcategoryid = cat.id;
    }

    // 6. UNIT
    if (unitName) {
      const { data: un } = await supabase
        .from("unitofmeasurement")
        .select("id")
        .ilike("unitname", unitName.trim())
        .maybeSingle();

      if (!un) {
        return res.status(200).json({
          resultMessage: {
            en: "Unit not found",
            vn: "Không tìm thấy đơn vị",
          },
          resultCode: "00169",
        });
      }
      updateData.unitofmeasurementid = un.id;
    }

    // 7. IMAGE
    if (image) {
      const url = await uploadImage(req.file);
      if (url) updateData.imageurl = url;
    }

    // 8. UPDATE
    const { data, error } = await supabase
      .from("food")
      .update(updateData)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Successfully",
        vn: "Thành công",
      },
      resultCode: "00178",
      food: data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      resultMessage: { en: "Server error", vn: "server error" },
      resultCode: "00168",
    });
  }
};

/**
 * @swagger
 * /food:
 *   post:
 *     summary: Delete food by ID
 *     description: |
 *       Delete a food item by its ID.
 *       User must be authenticated and can only delete their own food.
 *     tags:
 *       - Food
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foodId
 *             properties:
 *               foodId:
 *                 type: string
 *                 example: "f123456"
 *     responses:
 *       200:
 *         description: Food deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00184"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Food deletion successfull"
 *                     vn:
 *                       type: string
 *                       example: "Xóa thực phẩm thành công"
 *       400:
 *         description: Missing foodId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00400"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00401"
 *       404:
 *         description: Food not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00180"
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                       example: "Food not found"
 *                     vn:
 *                       type: string
 *                       example: "Không tìm thấy thực phẩm"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultCode:
 *                   type: string
 *                   example: "00168"
 */

export const deleteFood = async (req, res) => {
  try {
    const { foodId } = req.body;
    const user = req.user;

    if (!foodId) return res.status(400).json({ resultCode: "00400" });

    // 1. Find
    const { data: existing } = await supabase
      .from("food")
      .select("id, userid")
      .eq("userid", user.id)
      .ilike("id", foodId)
      .maybeSingle();

    if (!existing)
      return res.status(404).json({
        resultMessage: {
          en: "Food not found",
          vn: "Không tìm thấy thực phẩm",
        },
        resultCode: "00180",
      });

    // 3. Delete
    const { error } = await supabase.from("food").delete().eq("id", foodId);
    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Food deletion successfull",
        vn: "Xóa thực phẩm thành công",
      },
      resultCode: "00184",
    });
  } catch (err) {
    console.error("Delete Food Error:", err);
    res.status(500).json({ resultCode: "00168" });
  }
};

/**
 * @swagger
 * /food/list:
 *   get:
 *     summary: Lấy danh sách thực phẩm
 *     description: Lấy danh sách thực phẩm của bản thân và Admin nhóm.
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                 resultCode:
 *                   type: string
 *                 foods:
 *                   type: array
 *             example:
 *               resultMessage:
 *                 en: "Successfull retrieve all foods"
 *                 vn: "Lấy danh sách thực phẩm thành công"
 *               resultCode: "00188"
 *               foods:
 *                 - id: 1
 *                   name: "Cơm trắng"
 *                   imageUrl: "https://url-anh..."
 *                   type: "Ingredient"
 *                   createdAt: "2024-01-01T00:00:00Z"
 *                   updatedAt: "2024-01-01T00:00:00Z"
 *                   UserId: "uuid-user-1"
 *                   UnitOfMeasurement:
 *                     id: 5
 *                     unitName: "Bát"
 *                   FoodCategory:
 *                     id: 2
 *                     name: "Tinh bột"
 *                 - id: 2
 *                   name: "Thịt gà"
 *                   imageUrl: "https://url-anh..."
 *                   type: "Ingredient"
 *                   createdAt: "2024-01-02T00:00:00Z"
 *                   updatedAt: "2024-01-02T00:00:00Z"
 *                   UserId: "uuid-admin-1"
 *                   UnitOfMeasurement:
 *                     id: 1
 *                     unitName: "Kg"
 *                   FoodCategory:
 *                     id: 1
 *                     name: "Thịt"
 */
export const getAllFoods = async (req, res) => {
  try {
    const user = req.user;

    // 1. Get User Info
    const { data: userInfo, error: userError } = await supabase
      .from("users")
      .select("id, belongstogroupadminid")
      .eq("id", user.id)
      .single();

    if (userError || !userInfo) {
      return res.status(200).json({
        resultMessage: {
          en: "User info not found",
          vn: "Không tìm thấy thông tin người dùng",
        },
        resultCode: "00185",
      });
    }

    // 2. Allowed Owners
    const allowedOwnerIds = [user.id];
    if (userInfo.belongstogroupadminid) {
      allowedOwnerIds.push(userInfo.belongstogroupadminid);
    }

    // 3. Query
    const { data, error } = await supabase
      .from("food")
      .select(
        `
                id, name, imageurl, type, createdat, updatedat, userid,
                unitofmeasurement:unitofmeasurementid ( id, unitname ),
                foodcategory:foodcategoryid ( id, name )
            `
      )
      .in("userid", allowedOwnerIds)
      .order("name", { ascending: true });

    if (error) throw error;

    // 4. Map Data
    const formattedFoods = data.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageurl,
      type: item.type,
      createdAt: item.createdat,
      updatedAt: item.updatedat,
      UserId: item.userid,
      UnitOfMeasurement: {
        id: item.unitofmeasurement?.id,
        unitName: item.unitofmeasurement?.unitname,
      },
      FoodCategory: {
        id: item.foodcategory?.id,
        name: item.foodcategory?.name,
      },
    }));

    return res.status(200).json({
      resultMessage: {
        en: "Successfull retrieve all foods",
        vn: "Lấy danh sách thực phẩm thành công",
      },
      resultCode: "00188",
      foods: formattedFoods,
    });
  } catch (err) {
    console.error("Get Foods Error:", err);
    return res.status(500).json({
      resultMessage: {
        en: "Server error",
        vn: "Lỗi máy chủ nội bộ",
      },
      resultCode: "00157",
    });
  }
};
/**
 * @swagger
 * /food/unit:
 *   get:
 *     summary: Lấy danh sách đơn vị
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                 resultCode:
 *                   type: string
 *                 units:
 *                   type: array
 *             example:
 *               resultMessage:
 *                 en: "Successfully retrieved units"
 *                 vn: "Lấy các unit thành công"
 *               resultCode: "00110"
 *               units:
 *                 - id: 1
 *                   unitname: "Kg"
 *                   createdat: "2024-01-01T00:00:00Z"
 *                   updatedat: "2024-01-01T00:00:00Z"
 *                 - id: 2
 *                   unitname: "Lít"
 *                   createdat: "2024-01-01T00:00:00Z"
 *                   updatedat: "2024-01-01T00:00:00Z"
 */
export const getUnits = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("unitofmeasurement")
      .select("*")
      .order("unitname", { ascending: true });

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Successfully retrieved units",
        vn: "Lấy các unit thành công",
      },
      resultCode: "00110",
      units: data,
    });
  } catch (err) {
    console.error("Get Units Error:", err);
    res.status(500).json({
      resultMessage: {
        en: "Server error",
        vn: "server error",
      },
      resultCode: "00114",
    });
  }
};

/**
 * @swagger
 * /food/category:
 *   get:
 *     summary: Lấy danh sách danh mục
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                 resultCode:
 *                   type: string
 *                 categories:
 *                   type: array
 *             example:
 *               resultMessage:
 *                 en: "Successfully retrieved categories"
 *                 vn: "Lấy các category thành công"
 *               resultCode: "00129"
 *               categories:
 *                 - id: 1
 *                   name: "Thịt"
 *                   createdat: "2024-01-01T00:00:00Z"
 *                   updatedat: "2024-01-01T00:00:00Z"
 *                 - id: 2
 *                   name: "Rau củ"
 *                   createdat: "2024-01-01T00:00:00Z"
 *                   updatedat: "2024-01-01T00:00:00Z"
 */
export const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("foodcategory")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    res.status(200).json({
      resultMessage: {
        en: "Successfully retrieved categories",
        vn: "Lấy các category thành công",
      },
      resultCode: "00129",
      categories: data,
    });
  } catch (err) {
    console.error("Get Categories Error:", err);
    res.status(500).json({
      resultMessage: {
        en: "Server error",
        vn: "server error",
      },
      resultCode: "00133",
    });
  }
};

/**
 * @swagger
 * /food/list/{foodName}:
 *   get:
 *     summary: Lấy chi tiết thực phẩm theo tên
 *     description: Lấy thông tin chi tiết của một thực phẩm cụ thể (của bản thân hoặc Admin nhóm).
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: foodName
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên thực phẩm cần tìm
 *         example: "Thịt gà"
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultMessage:
 *                   type: object
 *                   properties:
 *                     en: { type: string }
 *                     vn: { type: string }
 *                 resultCode: { type: string }
 *                 food: { type: object }
 *             example:
 *               resultMessage:
 *                 en: "Successfully retrieved food details"
 *                 vn: "Lấy chi tiết thực phẩm thành công"
 *               resultCode: "00189"
 *               food:
 *                 id: 2
 *                 name: "Thịt gà"
 *                 imageUrl: "https://url-anh..."
 *                 type: "Ingredient"
 *                 createdAt: "2024-01-02T00:00:00Z"
 *                 updatedAt: "2024-01-02T00:00:00Z"
 *                 UserId: "uuid-admin-1"
 *                 UnitOfMeasurement:
 *                   id: 1
 *                   unitName: "Kg"
 *                 FoodCategory:
 *                   id: 1
 *                   name: "Thịt"
 *       404:
 *         description: Không tìm thấy (00180)
 */
export const getFoodByName = async (req, res) => {
  try {
    const { foodName } = req.params;
    const user = req.user;

    // 1. Lấy thông tin User để xác định Admin của nhóm
    const { data: userInfo, error: userError } = await supabase
      .from("users")
      .select("id, belongstogroupadminid")
      .eq("id", user.id)
      .single();

    if (userError || !userInfo) {
      return res.status(200).json({
        resultMessage: {
          en: "User info not found",
          vn: "Không tìm thấy thông tin người dùng",
        },
        resultCode: "00185",
      });
    }

    // 2. Tạo danh sách Owner ID hợp lệ (Mình + Admin)
    const allowedOwnerIds = [user.id];
    if (userInfo.belongstogroupadminid) {
      allowedOwnerIds.push(userInfo.belongstogroupadminid);
    }

    // 3. Query tìm Food theo Tên & Owner
    const { data, error } = await supabase
      .from("food")
      .select(
        `
                id, name, imageurl, type, createdat, updatedat, userid,
                unitofmeasurement:unitofmeasurementid ( id, unitname ),
                foodcategory:foodcategoryid ( id, name )
            `
      )
      .in("userid", allowedOwnerIds)
      .ilike("name", foodName.trim())
      .maybeSingle();

    if (error) throw error;

    // 4. Xử lý trường hợp không tìm thấy (Mã 00180 - Food not found)
    if (!data) {
      return res.status(200).json({
        resultMessage: {
          en: "Food not found",
          vn: "Không tìm thấy thực phẩm",
        },
        resultCode: "00180",
      });
    }

    // 5. Format dữ liệu trả về (CamelCase)
    const formattedFood = {
      id: data.id,
      name: data.name,
      imageUrl: data.imageurl,
      type: data.type,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
      UserId: data.userid,
      UnitOfMeasurement: {
        id: data.unitofmeasurement?.id,
        unitName: data.unitofmeasurement?.unitname,
      },
      FoodCategory: {
        id: data.foodcategory?.id,
        name: data.foodcategory?.name,
      },
    };

    return res.status(200).json({
      resultMessage: {
        en: "Successfully retrieved food details",
        vn: "Lấy chi tiết thực phẩm thành công",
      },
      resultCode: "00189",
      food: formattedFood,
    });
  } catch (err) {
    console.error("Get Food By Name Error:", err);
    return res.status(500).json({
      resultMessage: {
        en: "Server error",
        vn: "Lỗi máy chủ nội bộ",
      },
      resultCode: "00187",
    });
  }
};
