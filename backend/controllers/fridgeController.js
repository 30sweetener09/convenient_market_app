import { supabase } from "../db.js";

// Helper: cộng thêm số ngày vào ngày hiện tại -> ISO string
const addDaysISO = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

/**
 * @swagger
 * /fridge/create:
 *   post:
 *     summary: Thêm mục mới vào tủ lạnh
 *     description: API này cho phép thêm một loại thực phẩm vào kho tủ lạnh chung của nhóm.
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - foodName
 *               - quantity
 *               - useWithinDays
 *             properties:
 *               foodName:
 *                 type: string
 *                 description: Tên thực phẩm (Phải trùng khớp với tên trong danh sách Food Master Data).
 *                 example: "Thịt bò"
 *               quantity:
 *                 type: number
 *                 description: Số lượng thực phẩm cần thêm.
 *                 example: 2
 *               useWithinDays:
 *                 type: number
 *                 description: Số ngày dự kiến sử dụng
 *                 example: 7
 *               note:
 *                 type: string
 *                 description: Ghi chú thêm.
 *                 example: "Mua ở siêu thị BigC"
 *     responses:
 *       200:
 *         description: Mục trong tủ lạnh được tạo thành công
 *         content:
 *           application/json:
 *             example:
 *               resultMessage:
 *                 en: "Fridge item added successfully"
 *                 vn: "Mục trong tủ lạnh được tạo thành công"
 *               resultCode: "00202"
 *               newItem:
 *                 id: 15
 *                 foodid: 10
 *                 userid: 5
 *                 quantity: 2
 *                 expirydate: "2024-01-20T10:00:00.000Z"
 *                 note: "Mua ở siêu thị BigC"
 *                 createdat: "2024-01-13T10:00:00.000Z"
 *                 updatedat: "2024-01-13T10:00:00.000Z"
 *       400:
 *         description: Vui cung cấp tất cả các trường cần thiết
 *         content:
 *           application/json:
 *             example:
 *               resultMessage:
 *                 en: "Please provide all required fields"
 *                 vn: "Vui cung cấp tất cả các trường cần thiết"
 *               resultCode: "00203"
 *       409:
 *         description: Mục trong tủ lạnh cho thực phẩm đã tồn tại
 *         content:
 *           application/json:
 *             example:
 *               resultMessage:
 *                 en: "This food item already exists in the refrigerator"
 *                 vn: "Mục trong tủ lạnh cho thực phẩm đã tồn tại"
 *               resultCode: "00199"
 */
export const createFridgeItem = async (req, res) => {
    try {
        const { foodName, quantity, useWithinDays, note } = req.body;
        const user = req.user;

        // 1. Validate Input
        if (!foodName || !quantity || !useWithinDays) {
            return res.status(200).json({
                resultMessage: { 
                  en: "Please provide all required fields", 
                  vn: "Vui cung cấp tất cả các trường cần thiết" },
                resultCode: "00203"
            });
        }

        if (!user) {
             return res.status(200).json({
                resultMessage: { 
                  en: "Please log in",
                  vn: "Bạn chưa đăng nhập" },
                resultCode: "00225"
            });
        }

        const qty = parseFloat(quantity);
        const days = parseInt(useWithinDays, 10);
        if (isNaN(qty) || qty <= 0) return res.status(200).json({ 
            resultMessage: { 
              en: "Please provide a valid quantity!",
              vn: "Vui lòng cung cấp một số lượng hợp lệ!" },
            resultCode: "00192" });
        if (isNaN(days) || days <= 0) return res.status(200).json({ 
            resultMessage: { 
              en: "Please provide a valid 'use within' value!", 
              vn: "Vui lòng cung cấp một giá trị 'sử dụng trong khoảng' hợp lệ!" },
            resultCode: "00191" });

        // --- TÌM FOOD & CHECK QUYỀN ---
        const { data: userInfo } = await supabase
            .from("users")
            .select("id, belongstogroupadminid")
            .eq("id", user.id)
            .single();
        
        const allowedOwnerIds = [user.id];
        if (userInfo && userInfo.belongstogroupadminid) {
            allowedOwnerIds.push(userInfo.belongstogroupadminid);
        }

        // Tìm Food và lấy cả tên Unit nếu có
        const { data: food } = await supabase
            .from("food")
            .select("id, userid, unitofmeasurement (unitname)")
            .ilike("name", foodName.trim())
            .in("userid", allowedOwnerIds)
            .maybeSingle();

        if (!food) {
            // Check lỗi chi tiết (00198 hay 00208)
            const { data: otherFood } = await supabase
                .from("food")
                .select("id")
                .ilike("name", foodName.trim())
                .maybeSingle();

            if (otherFood) {
                return res.status(200).json({ 
                    resultMessage: { 
                      en: "Food item is not managed by this group", 
                      vn: "Thực phẩm không thuộc quyền quản trị của nhóm" },
                    resultCode: "00198" 
                });
            } else {
                return res.status(200).json({
                    resultMessage: { 
                      en: "Food not found", 
                      vn: "Thực phẩm không tồn tại" },
                    resultCode: "00208"
                });
            }
        }

        // 4. Check trùng lặp
        const { data: existing } = await supabase
            .from("fridge")
            .select("id")
            .eq("foodid", food.id)
            .eq("userid", user.id)
            .maybeSingle();

        if (existing) {
            return res.status(200).json({
                resultMessage: { 
                  en: "This food item already exists in the refrigerator", 
                  vn: "Mục trong tủ lạnh cho thực phẩm đã tồn tại" },
                resultCode: "00199"
            });
        }

        // 5. Insert (Đã bổ sung name và unit)
        const unitNameStr = food.unitofmeasurement?.unitname || ""; 

        const { data, error } = await supabase
            .from("fridge")
            .insert({
                name: foodName.trim(),
                quantity: qty,
                unit: unitNameStr,
                expirydate: addDaysISO(days),
                userid: user.id,
                foodid: food.id,
                note: note || ""
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            resultMessage: { 
              en: "Fridge item added successfully", 
              vn: "Mục trong tủ lạnh được tạo thành công" },
            resultCode: "00202",
            newItem: data
        });

    } catch (err) {
        console.error("Error creating fridge item:", err.message);
        return res.status(500).json({ error: "Internal server error", resultCode: "00197" });
    }
};

/**
 * @swagger
 * /fridge/update:
 *   put:
 *     summary: Cập nhật thông tin mục tủ lạnh
 *     description: Cập nhật số lượng, hạn sử dụng hoặc ghi chú cho một mục đã có trong tủ.
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *             properties:
 *               itemId:
 *                 type: integer
 *                 description: ID định danh của mục trong tủ lạnh
 *                 example: 15
 *               newQuantity:
 *                 type: number
 *                 description: Số lượng mới
 *                 example: 5.0
 *               newUseWithin:
 *                 type: number
 *                 description: Số ngày sử dụng mới để tính lại ngày hết hạn
 *                 example: 3
 *               newNote:
 *                 type: string
 *                 description: Ghi chú mới
 *                 example: "Sắp hết hạn, cần dùng ngay"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               resultMessage:
 *                 en: "Fridge item updated successfully"
 *                 vn: "Cập nhật mục tủ lạnh thành công"
 *               resultCode: "00216"
 *               updatedItem:
 *                 id: 15
 *                 quantity: 5.0
 *                 expirydate: "2024-01-16T10:00:00.000Z"
 *                 note: "Sắp hết hạn, cần dùng ngay"
 *                 updatedat: "2024-01-14T12:00:00.000Z"
 *       404:
 *         description: Không tìm thấy item hoặc không có quyền
 *         content:
 *           application/json:
 *             example:
 *               resultMessage:
 *                 en: "Item not found or denied"
 *                 vn: "Mục tủ lạnh không tồn tại hoặc không thuộc quyền quản lý"
 *               resultCode: "00213"
 */
export const updateFridgeItem = async (req, res) => {
    try {
        const { itemId, newQuantity, newUseWithin, newNote } = req.body;
        const user = req.user;

        // Validate ID (00204)
        if (!itemId) {
            return res.status(200).json({ 
                resultMessage: { 
                  en: "Please provide the refrigerator item ID", 
                  vn: "Vui lòng cung cấp id của item tủ lạnh" },
                resultCode: "00204" 
            });
        }

        // Validate update fields (00204x)
        if (newQuantity === undefined && newUseWithin === undefined && newNote === undefined) {
            return res.status(200).json({
                resultMessage: { 
                  en: "Please provide at least one of the following fields: newQuantity, newNote, newUseWithin",
                  vn: "Vui lòng cung cấp ít nhất một trong các trường sau: newQuantity, newNote, newUseWithin" },
                resultCode: "00204x"
            });
        }

        // 1. Tìm Item & Kiểm tra quyền chính chủ
        const { data: item } = await supabase
            .from("fridge")
            .select("id")
            .eq("id", itemId)
            .eq("userid", user.id)
            .maybeSingle();

        if (!item) {
            return res.status(200).json({
                resultMessage: { 
                  en: "Fridge item not found or you don't have permission to manage it",
                  vn: "Mục tủ lạnh không tồn tại hoặc không thuộc quyền quản lý" },
                resultCode: "00213"
            });
        }

        // 2. Prepare Data
        const updates = { updatedat: new Date().toISOString() };

        if (newQuantity !== undefined) {
            const q = parseFloat(newQuantity);
            if (isNaN(q) || q <= 0) return res.status(200).json({ 
              resultMessage: { 
                  en: "Please provide a valid quantity!",
                  vn: "Vui lòng cung cấp một lượng hợp lệ!" },
              resultCode: "00206" });
            updates.quantity = q;
        }

        if (newUseWithin !== undefined) {
            const d = parseInt(newUseWithin, 10);
            if (isNaN(d) || d <= 0) return res.status(200).json({ 
              resultMessage: {
                  en: "Please provide a valid 'use within' value!", 
                  vn: "Vui lòng cung cấp một giá trị 'sử dụng trong khoảng' hợp lệ!" },
              resultCode: "00205" });
            
            // Đảm bảo hàm addDaysISO đã tồn tại trong file
            updates.expirydate = addDaysISO(d);
        }

        if (newNote !== undefined) {
            updates.note = newNote;
        }

        // 3. Update (00216)
        const { data, error } = await supabase
            .from("fridge")
            .update(updates)
            .eq("id", itemId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            resultMessage: { 
              en: "Fridge item updated successfully", 
              vn: "Cập nhật mục tủ lạnh thành công" },
            resultCode: "00216",
            updatedItem: data
        });

    } catch (err) {
        // Đã sửa thông báo lỗi ở đây
        console.error("Error updating fridge item:", err.message);
        return res.status(500).json({ error: "Internal server error", resultCode: "00215" });
    }
};

/**
 * @swagger
 * /fridge/delete:
 *   delete:
 *     summary: Xóa mục tủ lạnh
 *     description: Xóa một món ăn khỏi danh sách tủ lạnh chung của nhóm.
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - foodName
 *             properties:
 *               foodName:
 *                 type: string
 *                 description: Tên thực phẩm muốn xóa
 *                 example: "Thịt bò"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             example:
 *               resultMessage:
 *                 en: "Fridge item deleted successfully"
 *                 vn: "Xóa mục trong tủ lạnh thành công"
 *               resultCode: "00224"
 *       404:
 *         description: Không tìm thấy món ăn này trong tủ
 *         content:
 *           application/json:
 *             example:
 *               resultMessage:
 *                 vn: "Mục tủ lạnh không tồn tại"
 *               resultCode: "00213"
 */
export const deleteFridgeItem = async (req, res) => {
    try {
        const { foodName } = req.body;
        const user = req.user;

        // 1. Validate Input (Mã 00217: Thiếu tên thực phẩm)
        if (!foodName) {
            return res.status(200).json({ 
                resultMessage: { 
                    en: "Please provide the food name",
                    vn: "Vui lòng cung cấp tên thực phẩm" 
                }, 
                resultCode: "00217" 
            });
        }

        // 2. Tìm item trong tủ lạnh của USER này có tên Food tương ứng
        const { data: item } = await supabase
            .from("fridge")
            .select(`
                id, 
                food!inner(name)
            `)
            .eq("userid", user.id)
            .ilike("food.name", foodName.trim()) 
            .maybeSingle();

        // 3. Check Not Found (Mã 00221: Mục tủ lạnh chưa được tạo)
        if (!item) {
            return res.status(200).json({ 
                resultMessage: { 
                  en: "Fridge item linked to this food has not been created",
                  vn: "Mục trong tủ lạnh liên kết với thực phẩm này chưa được tạo" },
                resultCode: "00221" 
            });
        }

        // 4. Delete (Mã 00224: Xóa thành công)
        const { error } = await supabase
            .from("fridge")
            .delete()
            .eq("id", item.id);

        if (error) throw error;

        return res.status(200).json({
            resultMessage: { 
              en: "Fridge item deleted successfully", 
              vn: "Xóa mục trong tủ lạnh thành công" },
            resultCode: "00224"
        });

    } catch (err) {
        console.error("Error deleting fridge item:", err.message);
        return res.status(500).json({ error: "Internal server error", resultCode: "00222" });
    }
};

/**
 * @swagger
 * /fridge/list:
 *   get:
 *     summary: Lấy danh sách thực phẩm trong tủ lạnh
 *     description: Lấy về toàn bộ danh sách đồ ăn hiện có trong kho tủ lạnh chung của nhóm.
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             example:
 *               resultMessage:
 *                 en: "Get fridge items successfully"
 *                 vn: "Lấy danh sách đồ tủ lạnh thành công"
 *               resultCode: "00228"
 *               items:
 *                 - id: 15
 *                   quantity: 2
 *                   expiryDate: "2024-01-20T10:00:00.000Z"
 *                   note: "Mua ở siêu thị BigC"
 *                   createdAt: "2024-01-13T10:00:00.000Z"
 *                   updatedAt: "2024-01-13T10:00:00.000Z"
 *                   Food:
 *                     id: 10
 *                     name: "Thịt bò"
 *                     imageUrl: "https://..."
 *                     type: "ingredient"
 */
export const getFridgeItems = async (req, res) => {
    try {
        const user = req.user;

        // Validate Login (00225: Bạn chưa vào nhóm nào / Chưa đăng nhập)
        const groupId = req.query.groupId || user?.groupId;
        
        if (!groupId) {
             return res.status(200).json({ 
                resultMessage: { 
                    en: "User not in group", 
                    vn: "Bạn chưa vào nhóm nào" },
                resultCode: "00225" 
            });
        }

        // Query 
        const { data, error } = await supabase
            .from("fridge")
            .select(`
                id, quantity, expirydate, note, createdat, updatedat,
                food:foodid ( id, name, imageurl, type )
            `)
            .eq("userid", user.id)
            .order("expirydate", { ascending: true });

        if (error) throw error;

        // Format CamelCase
        const items = data.map(i => ({
            id: i.id,
            quantity: i.quantity,
            expiryDate: i.expirydate,
            note: i.note,
            createdAt: i.createdat,
            updatedAt: i.updatedat,
            Food: i.food 
        }));

        // Success (00228)
        return res.status(200).json({
            resultMessage: { 
                en: "Get fridge items successfully", 
                vn: "Lấy danh sách đồ tủ lạnh thành công" },
            resultCode: "00228",
            items: items
        });

    } catch (err) {
        // Sửa nội dung Log
        console.error("Error getting fridge items:", err.message);
        return res.status(500).json({ error: "Internal server error", resultCode: "00226" });
    }
};
/**
 * @swagger
 * /fridge/list/{foodName}:
 *   get:
 *     summary: Lấy chi tiết mục tủ lạnh theo tên thực phẩm
 *     description: Tra cứu chi tiết một món ăn cụ thể trong tủ lạnh của nhóm.
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: foodName
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên thực phẩm cần tìm kiếm (Ví dụ Salmon).
 *         example: "Thịt bò"
 *     responses:
 *       200:
 *         description: Lấy item cụ thể thành công
 *         content:
 *           application/json:
 *             example:
 *               resultMessage:
 *                 en: "Get specific item successfull"
 *                 vn: "Lấy item cụ thể thành công"
 *               resultCode: "00237"
 *               item:
 *                 id: 15
 *                 expiredDate: "2024-01-20T10:00:00.000Z"
 *                 quantity: 2
 *                 note: "Mua ở siêu thị"
 *                 createdAt: "2024-01-13T10:00:00.000Z"
 *                 updatedAt: "2024-01-13T10:00:00.000Z"
 *                 FoodId: 10
 *                 UserId: 5
 *                 Food:
 *                   id: 10
 *                   name: "Thịt bò"
 *                   imageUrl: "https://..."
 *                   type: "ingredient"
 *                   UnitOfMeasurement:
 *                     id: 1
 *                     unitName: "kg"
 *                   FoodCategory:
 *                     id: 2
 *                     name: "Thịt"
 *       200-NotFound:
 *         description: Mục tủ lạnh không tồn tại
 *         content:
 *           application/json:
 *             example:
 *               resultMessage:
 *                 vn: "Mục tủ lạnh không tồn tại"
 *               resultCode: "00213"
 */
export const getSpecificFridgeItem = async (req, res) => {
    try {
        const { foodName } = req.params;
        const user = req.user;

        const groupId = user?.groupId;
        if (!groupId) return res.status(200).json({ 
            resultMessage: { 
                en: "User not in group", 
                vn: "Bạn chưa vào nhóm nào" },
            resultCode: "00225" 
        });

        if (!user) return res.status(403).json({ resultCode: "00006", resultMessage: { vn: "Chưa đăng nhập" } });

        // 1. Query
        const { data, error } = await supabase
            .from("fridge")
            .select(`
                id, quantity, expirydate, note, createdat, updatedat, userid,
                food:foodid!inner (
                    id, name, imageurl, type, createdat, updatedat,
                    unit:unitofmeasurementid ( id, unitname, createdat, updatedat ),
                    cat:foodcategoryid ( id, name, createdat, updatedat )
                )
            `)
            .eq("userid", user.id)
            .ilike("food.name", foodName.trim()) 
            .maybeSingle();

        if (error) throw error;

        // 2. Check Not Found (00213)
        if (!data) {
            return res.status(200).json({
                resultMessage: { 
                    en: "Fridge item not found",
                    vn: "Mục tủ lạnh không tồn tại" },
                resultCode: "00213"
            });
        }

        // 3. Format chuẩn JSON mẫu
        const formatted = {
            id: data.id,
            expiredDate: data.expirydate,
            quantity: data.quantity,
            note: data.note,
            createdAt: data.createdat,
            updatedAt: data.updatedat,
            FoodId: data.food.id,
            UserId: data.userid,
            Food: {
                id: data.food.id,
                name: data.food.name,
                imageUrl: data.food.imageurl,
                type: data.food.type,
                createdAt: data.food.createdat,
                updatedAt: data.food.updatedat,
                FoodCategoryId: data.food.cat?.id,
                UnitOfMeasurementId: data.food.unit?.id,
                UnitOfMeasurement: {
                    id: data.food.unit?.id,
                    unitName: data.food.unit?.unitname,
                    createdAt: data.food.unit?.createdat,
                    updatedAt: data.food.unit?.updatedat
                },
                FoodCategory: {
                    id: data.food.cat?.id,
                    name: data.food.cat?.name,
                    createdAt: data.food.cat?.createdat,
                    updatedAt: data.food.cat?.updatedat
                }
            }
        };

        // 4. Return Success (00237)
        return res.status(200).json({
            resultMessage: { 
                en: "Successfully retrieved specific item", 
                vn: "Lấy item cụ thể thành công" },
            resultCode: "00237",
            item: formatted
        });

    } catch (err) {
        console.error("Error getting specific fridge item:", err.message);
        return res.status(500).json({ error: "Internal server error", resultCode: "00234" });
    }
};
