import { supabase } from "../db.js";

// Helper: Cộng ngày
const addDaysISO = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

/* ==========================================================================
   PHẦN 1: QUẢN LÝ CÁI TỦ LẠNH (CONTAINER)
   ========================================================================== */

/**

/**
 * @swagger
 * /fridge:
 *   post:
 *     summary: Tạo tủ lạnh mới
 *     description: Tạo một cái tủ lạnh mới gán vào một nhóm.
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, groupId]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên tủ lạnh
 *                 example: "Tủ Đông Hòa Phát"
 *               groupId:
 *                 type: integer
 *                 description: ID nhóm sở hữu tủ này (User phải là member nhóm này)
 *                 example: 1
 *               description:
 *                 type: string
 *                 description: Mô tả thêm
 *                 example: "Tủ chuyên đựng đồ đông lạnh"
 *     responses:
 *       200:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 resultCode: "00200"
 *                 resultMessage:
 *                   vn: "Tạo tủ lạnh thành công"
 *                 fridge:
 *                   id: 15
 *                   name: "Tủ Đông Hòa Phát"
 *                   group_id: 1
 */
export const createFridge = async (req, res) => {
    try {
        const { name, groupId, description } = req.body;
        const user = req.user;

        if (!name || !groupId) {
            return res.status(400).json({ 
                resultCode: "00203", 
                resultMessage: { vn: "Thiếu tên tủ hoặc ID nhóm" } });
        }

        // Check quyền: User phải thuộc Group này
        if (!user.groupIds.includes(parseInt(groupId))) {
            return res.status(403).json({ 
                resultCode: "00219", 
                resultMessage: { vn: "Bạn không phải thành viên của nhóm này" } });
        }

        const { data, error } = await supabase
            .from("fridge")
            .insert({
                name: name.trim(),
                group_id: groupId,
                description: description || ""
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            resultCode: "00200",
            resultMessage: { vn: "Tạo tủ lạnh thành công" },
            fridge: data
        });
    } catch (err) {
        console.error("Create Fridge Error:", err);
        return res.status(500).json({ resultCode: "00197" });
    }
};

/**
 * @swagger
 * /fridge:
 *   get:
 *     summary: Lấy danh sách tủ lạnh
 *     description: Lấy danh sách tủ lạnh mà user có quyền truy cập. Có thể lọc theo Group ID.
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *         description: ID của nhóm (nếu muốn lọc tủ của 1 nhóm cụ thể)
 *         example: 1
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 resultCode: "00228"
 *                 resultMessage:
 *                   vn: "Lấy danh sách tủ lạnh thành công"
 *                 fridges:
 *                   - id: 10
 *                     name: "Tủ lạnh Samsung"
 *                     group_id: 1
 *                     description: "Tủ ở tầng 1"
 */
export const getAllFridge = async (req, res) => {
    try {
        const { groupId } = req.query;
        const user = req.user; // req.user.groupIds từ middleware

        let query = supabase
            .from("fridge")
            .select("*")
            .order("createdat", { ascending: false });

        // Nếu client gửi groupId -> Lọc theo group đó (cần check quyền)
        if (groupId) {
            if (!user.groupIds.includes(parseInt(groupId))) {
                 return res.status(403).json({ 
                    resultCode: "00219", 
                    resultMessage: { vn: "Bạn không có quyền truy cập nhóm này" } });
            }
            query = query.eq("group_id", groupId);
        } else {
            // Nếu không gửi groupId -> Lấy tất cả tủ thuộc các nhóm mình tham gia
            query = query.in("group_id", user.groupIds);
        }

        const { data, error } = await query;
        if (error) throw error;

        return res.status(200).json({
            resultCode: "00228",
            resultMessage: { vn: "Lấy danh sách tủ lạnh thành công" },
            fridges: data
        });
    } catch (err) {
        console.error("Get All Fridge Error:", err);
        return res.status(500).json({ resultCode: "00197" });
    }
};

/**
 * @swagger
 * /fridge/{id}:
 *   get:
 *     summary: Lấy chi tiết một tủ lạnh
 *     tags: [Fridge]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của tủ lạnh
 *         example: 10
 *     responses:
 *       200:
 *         description: Thành công
 */
export const getFridgeById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const { data, error } = await supabase
            .from("fridge")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (!data) return res.status(404).json({ resultCode: "00213", resultMessage: { vn: "Tủ lạnh không tồn tại" } });
        
        // Check quyền
        if (!user.groupIds.includes(data.group_id)) {
            return res.status(403).json({ resultCode: "00219", resultMessage: { vn: "Không có quyền truy cập" } });
        }

        return res.status(200).json({
            resultCode: "00228",
            resultMessage: { vn: "Lấy chi tiết thành công" },
            fridge: data
        });
    } catch (err) {
        return res.status(500).json({ resultCode: "00197" });
    }
};

/* ==========================================================================
   PHẦN 2: QUẢN LÝ THỰC PHẨM TRONG TỦ (FRIDGE ITEMS - BẢNG fridge_food)
   ========================================================================== */


/**
 * @swagger
 * /fridge/item/create:
 *   post:
 *     summary: Thêm thực phẩm vào tủ lạnh
 *     description: Thêm một món ăn mới vào tủ lạnh cụ thể (Insert vào bảng fridge_food).
 *     tags: [Fridge Item]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fridgeId, foodName, quantity]
 *             properties:
 *               fridgeId:
 *                 type: integer
 *                 description: ID của tủ lạnh muốn bỏ đồ vào (Bắt buộc)
 *                 example: 10
 *               foodName:
 *                 type: string
 *                 description: Tên món ăn (Hệ thống sẽ tự tìm ID món ăn tương ứng)
 *                 example: "Thịt bò Kobe"
 *               quantity:
 *                 type: number
 *                 description: Số lượng
 *                 example: 2.5
 *               unit:
 *                 type: string
 *                 description: Đơn vị tính (nếu khác mặc định)
 *                 example: "Kg"
 *               useWithinDays:
 *                 type: integer
 *                 description: Số ngày hết hạn (tính từ hôm nay)
 *                 example: 7
 *     responses:
 *       200:
 *         description: Thêm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 resultCode: "00202"
 *                 resultMessage:
 *                   vn: "Thêm vào tủ thành công"
 *                 newItem:
 *                   id: 101
 *                   fridge_id: 10
 *                   food_id: 55
 *                   quantity: 2.5
 *                   expirydate: "2024-05-20T00:00:00Z"
 */
export const createFridgeItem = async (req, res) => {
    try {
        const { fridgeId, foodName, quantity, useWithinDays, unit } = req.body;
        const user = req.user;

        // 1. VALIDATION CƠ BẢN
        if (!fridgeId || !foodName || !quantity) {
            return res.status(400).json({ resultCode: "00203", resultMessage: { vn: "Thiếu thông tin (fridgeId, foodName, quantity)" } });
        }

        if (parseFloat(quantity) <= 0) {
            return res.status(400).json({ resultCode: "00205", resultMessage: { vn: "Số lượng phải lớn hơn 0" } });
        }

        // 2. CHECK QUYỀN TỦ LẠNH
        const { data: fridgeInfo } = await supabase.from("fridge").select("group_id").eq("id", fridgeId).maybeSingle();
        if (!fridgeInfo) return res.status(404).json({ resultCode: "00213", resultMessage: { vn: "Tủ lạnh không tồn tại" } });
        
        if (!user.groupIds.includes(fridgeInfo.group_id)) {
            return res.status(403).json({ resultCode: "00219", resultMessage: { vn: "Không có quyền thêm vào tủ này" } });
        }

        // 3. TÌM FOOD ID (Của chính user)
        const { data: food } = await supabase
            .from("food")
            .select("id, unitofmeasurementid, unit:unitofmeasurementid(unitname)")
            .eq("userid", user.id)
            .ilike("name", foodName.trim())
            .maybeSingle();

        if (!food) {
            return res.status(404).json({ 
                resultCode: "00208", 
                resultMessage: { vn: "Bạn chưa tạo món ăn này. Vui lòng tạo món ăn trước." } 
            });
        }

        // 4. XỬ LÝ NGÀY HẾT HẠN
        let expiryDate = null;
        if (useWithinDays !== undefined && useWithinDays !== null && useWithinDays !== "") {
            const days = parseInt(useWithinDays);
            if (days < 0) return res.status(400).json({ resultCode: "00206", resultMessage: { vn: "Số ngày hết hạn không hợp lệ" } });
            expiryDate = addDaysISO(days);
        }

        // 5. [BỔ SUNG] VALIDATE & XỬ LÝ UNIT (ĐƠN VỊ TÍNH)
        let finalUnit = "";

        if (unit && unit.trim() !== "") {
            // Trường hợp A: User gửi unit mới -> Phải check xem DB có unit này không
            const { data: validUnit } = await supabase
                .from("unitofmeasurement")
                .select("unitname")
                .ilike("unitname", unit.trim()) // Tìm không phân biệt hoa thường
                .maybeSingle();

            if (!validUnit) {
                 return res.status(404).json({ 
                     resultCode: "00207", // Mã lỗi mới: Unit không tồn tại
                     resultMessage: { vn: "Đơn vị tính không tồn tại trong hệ thống" } 
                 });
            }
            finalUnit = validUnit.unitname; // Lấy tên chuẩn từ DB (VD: user nhập 'kg' -> lưu 'Kg')
        } else {
            // Trường hợp B: User để trống -> Lấy unit mặc định của món ăn
            finalUnit = food.unit?.unitname || "";
        }

        // 6. INSERT
        const { data, error } = await supabase
            .from("fridge_food")
            .insert({
                fridge_id: fridgeId,
                food_id: food.id,
                quantity: parseFloat(quantity),
                unit: finalUnit, 
                expirydate: expiryDate
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            resultCode: "00202",
            resultMessage: { vn: "Thêm vào tủ thành công" },
            newItem: data
        });
    } catch (err) {
        console.error("Create Item Error:", err);
        return res.status(500).json({ resultCode: "00197" });
    }
};


/**
 * @swagger
 * /fridge/item/update:
 *   put:
 *     summary: Cập nhật thông tin món trong tủ
 *     description: Sửa số lượng hoặc hạn sử dụng của một item cụ thể.
 *     tags: [Fridge Item]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId]
 *             properties:
 *               itemId:
 *                 type: integer
 *                 description: ID của dòng trong tủ lạnh (lấy từ API /item/list)
 *                 example: 101
 *               newQuantity:
 *                 type: number
 *                 description: Số lượng mới
 *                 example: 1.5
 *               newUseWithin:
 *                 type: integer
 *                 description: Số ngày hết hạn mới (tính lại từ hôm nay)
 *                 example: 3
 *               newUnit:
 *                 type: string
 *                 description: Đơn vị mới
 *                 example: "Hộp"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 resultCode: "00203"
 *                 resultMessage:
 *                   vn: "Cập nhật thành công"
 *                 updatedItem:
 *                   id: 101
 *                   quantity: 1.5
 *                   unit: "Hộp"
 *                   expirydate: "2024-05-16T00:00:00Z"
 */
export const updateFridgeItem = async (req, res) => {
    try {
        const { itemId, newQuantity, newUseWithin, newUnit } = req.body;
        const user = req.user;

        if (!itemId) return res.status(400).json({ resultCode: "00204", resultMessage: { vn: "Thiếu Item ID" } });

        // 1. Tìm item và check quyền (Join fridge -> check group)
        const { data: item } = await supabase
            .from("fridge_food")
            .select(`id, fridge:fridge_id ( group_id )`)
            .eq("id", itemId)
            .maybeSingle();

        if (!item) return res.status(404).json({ resultCode: "00213", resultMessage: { vn: "Mục không tồn tại" } });
        
        if (!user.groupIds.includes(item.fridge.group_id)) {
            return res.status(403).json({ resultCode: "00219", resultMessage: { vn: "Không có quyền sửa mục này" } });
        }

        // 2. Prepare Update
        const updates = {};
        if (newQuantity) updates.quantity = parseFloat(newQuantity);
        if (newUnit) updates.unit = newUnit;
        if (newUseWithin) updates.expirydate = addDaysISO(parseInt(newUseWithin));

        // 3. Update
        const { data, error } = await supabase
            .from("fridge_food")
            .update(updates)
            .eq("id", itemId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            resultCode: "00216",
            resultMessage: { vn: "Cập nhật thành công" },
            updatedItem: data
        });

    } catch (err) {
        console.error("Update Item Error:", err);
        return res.status(500).json({ resultCode: "00215" });
    }
};

/**
 * @swagger
 * /fridge/item/delete:
 *   delete:
 *     summary: Xóa món ăn khỏi tủ
 *     tags: [Fridge Item]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId]
 *             properties:
 *               itemId:
 *                 type: integer
 *                 description: ID của dòng cần xóa (Khuyên dùng cách này)
 *                 example: 101
 *               foodName:
 *                 type: string
 *                 description: (Cách cũ) Tên món cần xóa
 *                 example: "Thịt gà"
 *               fridgeId:
 *                 type: integer
 *                 description: (Cách cũ - Bắt buộc đi kèm foodName) ID tủ
 *                 example: 10
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 resultCode: "00204"
 *                 resultMessage:
 *                   vn: "Xóa món ăn thành công"
 */
export const deleteFridgeItem = async (req, res) => {
    try {
        const { itemId, foodName, fridgeId } = req.body;
        const user = req.user;

        let targetItemId = itemId;
        let targetGroupId = null;

        // CASE A: Xóa bằng ID (Khuyên dùng)
        if (itemId) {
            const { data: item } = await supabase
                .from("fridge_food")
                .select(`id, fridge:fridge_id ( group_id )`)
                .eq("id", itemId)
                .maybeSingle();
            
            if (item) {
                targetGroupId = item.fridge.group_id;
            } else {
                return res.status(404).json({ resultCode: "00221" });
            }
        } 
        // CASE B: Xóa bằng Tên + Tủ (Để tương thích route cũ, nhưng cần fridgeId)
        else if (foodName && fridgeId) {
            const { data: item } = await supabase
                .from("fridge_food")
                .select(`id, fridge:fridge_id ( group_id ), food:food_id!inner(name)`)
                .eq("fridge_id", fridgeId)
                .ilike("food.name", foodName.trim())
                .maybeSingle(); // Nếu có nhiều item cùng tên, sẽ xóa cái đầu tiên tìm thấy

            if (item) {
                targetItemId = item.id;
                targetGroupId = item.fridge.group_id;
            } else {
                return res.status(404).json({ resultCode: "00221", resultMessage: { vn: "Không tìm thấy món ăn này trong tủ" } });
            }
        } else {
            return res.status(400).json({ resultCode: "00217", resultMessage: { vn: "Vui lòng cung cấp itemId hoặc (foodName + fridgeId)" } });
        }

        // Check quyền
        if (!user.groupIds.includes(targetGroupId)) {
            return res.status(403).json({ resultCode: "00219" });
        }

        // Delete
        const { error } = await supabase.from("fridge_food").delete().eq("id", targetItemId);
        if (error) throw error;

        return res.status(200).json({
            resultCode: "00224",
            resultMessage: { vn: "Xóa mục tủ lạnh thành công" }
        });

    } catch (err) {
        console.error("Delete Item Error:", err);
        return res.status(500).json({ resultCode: "00197" });
    }
};

/**
 * @swagger
 * /fridge/item/list:
 *   get:
 *     summary: Xem đồ trong tủ lạnh
 *     description: Lấy danh sách thực phẩm. Bắt buộc phải có fridgeId hoặc groupId.
 *     tags: [Fridge Item]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fridgeId
 *         schema:
 *           type: integer
 *         description: Xem đồ của riêng tủ này (Ưu tiên dùng)
 *         example: 10
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *         description: Xem tất cả đồ của cả nhóm (Gộp nhiều tủ)
 *         example: 1
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 resultCode: "00228"
 *                 items:
 *                   - id: 101
 *                     quantity: 2.5
 *                     fridgeName: "Tủ Đông Hòa Phát"
 *                     Food:
 *                       name: "Thịt bò"
 *                       imageurl: "..."
 */
export const getFridgeItems = async (req, res) => {
    try {
        const { fridgeId, groupId } = req.query;
        const user = req.user;

        let query = supabase
            .from("fridge_food")
            .select(`
                id, quantity, unit, expirydate, created_at, fridge_id,
                food:food_id ( id, name, imageurl, type ),
                fridge:fridge_id ( id, name, group_id )
            `)
            .order("expirydate", { ascending: true });

        // CASE 1: Lọc theo 1 tủ cụ thể (Ưu tiên)
        if (fridgeId) {
            // Cần check quyền tủ này trước (để đảm bảo an toàn data)
            const { data: fridgeCheck } = await supabase.from("fridge").select("group_id").eq("id", fridgeId).maybeSingle();
            
            if (!fridgeCheck || !user.groupIds.includes(fridgeCheck.group_id)) {
                 return res.status(403).json({ resultCode: "00219", resultMessage: { vn: "Không có quyền hoặc tủ không tồn tại" } });
            }
            query = query.eq("fridge_id", fridgeId);
        } 
        // CASE 2: Lọc tất cả đồ trong 1 Group (Gồm nhiều tủ)
        else if (groupId) {
             if (!user.groupIds.includes(parseInt(groupId))) {
                 return res.status(403).json({ resultCode: "00219", resultMessage: { vn: "Không có quyền nhóm này" } });
            }
            // Join ngược để filter theo group_id của fridge
            // Lưu ý: Supabase cú pháp filter nested hơi phức tạp, cách đơn giản là lấy list fridgeIds trước
            const { data: fridges } = await supabase.from("fridge").select("id").eq("group_id", groupId);
            const fridgeIds = fridges.map(f => f.id);
            
            if (fridgeIds.length === 0) return res.status(200).json({ resultCode: "00228", items: [] });
            
            query = query.in("fridge_id", fridgeIds);
        } 
        // CASE 3: Không gửi gì -> Lỗi hoặc trả về rỗng (để an toàn nên bắt buộc filter)
        else {
             return res.status(400).json({ resultCode: "00203", resultMessage: { vn: "Vui lòng cung cấp fridgeId hoặc groupId" } });
        }

        const { data, error } = await query;
        if (error) throw error;

        // Format
        const items = data.map(i => ({
            id: i.id,
            quantity: i.quantity,
            unit: i.unit,
            expiryDate: i.expirydate,
            fridgeName: i.fridge?.name,
            Food: i.food
        }));

        return res.status(200).json({
            resultCode: "00228",
            resultMessage: { vn: "Lấy danh sách thành công" },
            items: items
        });

    } catch (err) {
        console.error("Get Fridge Items Error:", err);
        return res.status(500).json({ resultCode: "00197" });
    }
};

/**
 * @swagger
 * /fridge/item/search/{foodName}:
 *   get:
 *     summary: Tìm kiếm món ăn
 *     description: Tìm xem món ăn này đang nằm ở tủ nào, số lượng bao nhiêu.
 *     tags: [Fridge Item]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: foodName
 *         required: true
 *         schema:
 *           type: string
 *         description: Tên món ăn cần tìm kiếm
 *         example: "Thịt gà"
 *     responses:
 *       200:
 *         description: Tìm thấy kết quả
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 resultCode: "00228"
 *                 resultMessage:
 *                   vn: "Tìm kiếm thành công"
 *                 items:
 *                   - id: 101
 *                     fridgeName: "Tủ Đông Hòa Phát"
 *                     quantity: 3.0
 *                     unit: "Kg"
 *                     expirydate: "2024-05-25T00:00:00Z"
 */
export const getSpecificFridgeItem = async (req, res) => {
    try {
        const { foodName } = req.params;
        const user = req.user;

        // Tìm tất cả item có tên food tương ứng VÀ thuộc các tủ của group mình tham gia
        // Bước 1: Lấy tất cả tủ lạnh user được phép xem
        const { data: allowedFridges } = await supabase
            .from("fridge")
            .select("id")
            .in("group_id", user.groupIds);
            
        const allowedFridgeIds = allowedFridges.map(f => f.id);

        if (allowedFridgeIds.length === 0) {
             return res.status(200).json({ resultCode: "00237", items: [] }); // Không có tủ nào
        }

        // Bước 2: Query fridge_food join food
        const { data, error } = await supabase
            .from("fridge_food")
            .select(`
                id, quantity, expirydate, unit,
                food:food_id!inner( name, imageurl, type ),
                fridge:fridge_id( id, name )
            `)
            .in("fridge_id", allowedFridgeIds)
            .ilike("food.name", foodName.trim()) // Tìm theo tên Food
            .order("expirydate", { ascending: true });

        if (error) throw error;

        return res.status(200).json({
            resultCode: "00237",
            resultMessage: { vn: "Tìm kiếm thành công" },
            items: data // Trả về mảng vì có thể có nhiều hộp thịt gà ở các tủ khác nhau
        });

    } catch (err) {
        console.error("Search Fridge Item Error:", err);
        return res.status(500).json({ resultCode: "00234" });
    }
};
