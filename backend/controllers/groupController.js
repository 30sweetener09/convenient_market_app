import { supabase, supabaseAdmin } from "../db.js";

/* =========================================================
   CONSTANTS + HELPERS
========================================================= */
const BUCKET = "group-images";

/**
 * Upload avatar group lên Supabase Storage
 * @param {string} groupId
 * @param {object} file - multer file
 * @returns {string} publicUrl
 */
const uploadGroupImage = async (groupId, file) => {
  const ext = file.originalname.split(".").pop();
  const filePath = `groups/${groupId}/avatar.${ext}`;

  await supabaseAdmin.storage.from(BUCKET).upload(filePath, file.buffer, {
    contentType: file.mimetype,
    upsert: true,
  });

  const { data } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Xóa ảnh group theo public url
 * @param {string|null} imageurl
 */
const deleteGroupImageByUrl = async (imageurl) => {
  if (!imageurl) return;
  const path = imageurl.split(`/object/public/${BUCKET}/`)[1];
  if (!path) return;
  await supabaseAdmin.storage.from(BUCKET).remove([path]);
};

/* =========================================================
   SWAGGER: TAGS + SCHEMAS
========================================================= */
/**
 * @swagger
 * tags:
 *   name: Group
 *   description: Quản lý group chat, ảnh đại diện và thành viên
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "uuid"
 *         name:
 *           type: string
 *           example: "Nhóm AI"
 *         description:
 *           type: string
 *           example: "Thảo luận môn AI"
 *         imageurl:
 *           type: string
 *           example: "https://xxx.supabase.co/storage/v1/object/public/group-images/groups/uuid/avatar.png"
 *         created_at:
 *           type: string
 *           format: date-time
 *
 *     GroupWithRole:
 *       allOf:
 *         - $ref: '#/components/schemas/Group'
 *         - type: object
 *           properties:
 *             role:
 *               type: string
 *               example: "owner"
 *
 *     GroupMember:
 *       type: object
 *       properties:
 *         role_in_group:
 *           type: string
 *           example: "member"
 *         joined_at:
 *           type: string
 *           format: date-time
 *         users:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             username:
 *               type: string
 *             email:
 *               type: string
 *             photourl:
 *               type: string
 */

/* =========================================================
   GROUP APIs
========================================================= */

/**
 * @swagger
 * /group:
 *   get:
 *     summary: Lấy danh sách group mà user đang tham gia
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách group
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GroupWithRole'
 */
export const getGroups = async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabaseAdmin
    .from("group_members")
    .select(`
      role_in_group,
      group:group_id (
        id, name, description, imageurl, created_at
      )
    `)
    .eq("user_id", userId);

  if (error) return res.status(400).json({ error: error.message });

  res.json(
    data.map(r => ({
      ...r.group,
      role: r.role_in_group,
    }))
  );
};

/**
 * @swagger
 * /group/search:
 *   get:
 *     summary: Tìm group theo tên (trong group user tham gia)
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *     responses:
 *       200:
 *         description: Danh sách group phù hợp
 */
export const getGroupsByName = async (req, res) => {
  const userId = req.user.id;
  const { keyword = "" } = req.query;

  const { data, error } = await supabaseAdmin
    .from("group_members")
    .select(`
      role_in_group,
      group:group_id (id, name, description, imageurl)
    `)
    .eq("user_id", userId)
    .ilike("group.name", `%${keyword}%`);

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
};

/**
 * @swagger
 * /group:
 *   post:
 *     summary: Tạo group mới (có thể upload ảnh đại diện)
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Ảnh đại diện group
 *     responses:
 *       200:
 *         description: Tạo group thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 */
export const createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description } = req.body;

    const { data: group, error } = await supabaseAdmin
      .from("groups")
      .insert({ name, description, created_by: userId })
      .select()
      .single();

    if (error) throw error;

    let imageurl = null;
    if (req.file) {
      imageurl = await uploadGroupImage(group.id, req.file);
      await supabaseAdmin.from("groups").update({ imageurl }).eq("id", group.id);
    }

    await supabaseAdmin.from("group_members").insert({
      group_id: group.id,
      user_id: userId,
      role_in_group: "groupAdmin",
      group_role_id: 1,
      joined_at: new Date(),
    });

    res.json({ ...group, imageurl });
  } catch {
    res.status(500).json({ error: "Create group failed" });
  }
};

/**
 * @swagger
 * /group/{id}:
 *   put:
 *     summary: Cập nhật thông tin group (có thể đổi ảnh)
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
export const updateGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const { name, description } = req.body;

    const { data: oldGroup } = await supabaseAdmin
      .from("groups")
      .select("imageurl")
      .eq("id", groupId)
      .single();

    const updates = { updated_at: new Date() };
    if (name) updates.name = name;
    if (description) updates.description = description;

    if (req.file) {
      await deleteGroupImageByUrl(oldGroup?.imageurl);
      updates.imageurl = await uploadGroupImage(groupId, req.file);
    }

    const { data, error } = await supabaseAdmin
      .from("groups")
      .update(updates)
      .eq("id", groupId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch {
    res.status(500).json({ error: "Update group failed" });
  }
};

/**
 * @swagger
 * /group/{id}:
 *   delete:
 *     summary: Xóa group (kèm ảnh và toàn bộ thành viên)
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
export const deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id;

    const { data: group } = await supabaseAdmin
      .from("groups")
      .select("imageurl")
      .eq("id", groupId)
      .single();

    await deleteGroupImageByUrl(group?.imageurl);

    await supabaseAdmin.from("group_members").delete().eq("group_id", groupId);
    await supabaseAdmin.from("groups").delete().eq("id", groupId);

    res.json({ message: "Group deleted" });
  } catch {
    res.status(500).json({ error: "Delete group failed" });
  }
};

/* =========================================================
   MEMBER APIs
========================================================= */

/**
 * @swagger
 * /group/{id}/members:
 *   get:
 *     summary: Lấy danh sách thành viên trong group
 *     description: >
 *       Trả về danh sách thành viên của group theo ID.
 *       User phải là thành viên của group.
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của group
 *         schema:
 *           type: string
 *           example: "f1a3b9d2-8c4a-4e9a-b123-abc456789000"
 *     responses:
 *       200:
 *         description: Danh sách thành viên
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   role_in_group:
 *                     type: string
 *                     example: member
 *                   joined_at:
 *                     type: string
 *                     format: date-time
 *                   users:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       photourl:
 *                         type: string
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập group
 *       404:
 *         description: Group không tồn tại
 */
export const getGroupMembers = async (req, res) => {
  const groupId = req.params.id;
  console.log("Fetching members for group:", groupId);

  const { data, error } = await supabaseAdmin
    .from("group_members")
    .select(`
      role_in_group,
      joined_at,
      users:user_id!inner (id, username, email, imageurl)
    `)
    .eq("group_id", groupId);

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
};

/**
 * @swagger
 * /group/{id}/members:
 *   post:
 *     summary: Thêm thành viên vào group bằng email
 *     description: >
 *       Thêm một user vào group thông qua email.
 *       Backend sẽ tự tìm userId từ email.
 *       Chỉ owner hoặc admin của group mới có quyền thực hiện.
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của group
 *         schema:
 *           type: string
 *           example: "f1a3b9d2-8c4a-4e9a-b123-abc456789000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email của user cần thêm vào group
 *                 example: "user@gmail.com"
 *               role:
 *                 type: string
 *                 description: Vai trò trong group
 *                 enum: [member, admin]
 *                 example: member
 *     responses:
 *       200:
 *         description: Thêm thành viên thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group_id:
 *                   type: string
 *                 user_id:
 *                   type: string
 *                 role_in_group:
 *                   type: string
 *                 joined_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Thành viên đã tồn tại hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền thêm thành viên
 *       404:
 *         description: Không tìm thấy user theo email
 */


export const addMember = async (req, res) => {
  try {
    const groupId = req.params.id;
    const { email, role = "member" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // 1️⃣ Tìm user theo email
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    // 2️⃣ Check user đã ở trong group chưa
    const { data: exists } = await supabaseAdmin
      .from("group_members")
      .select("group_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (exists) {
      return res.status(400).json({ error: "Member already exists in group" });
    }

    // 3️⃣ Insert member
    const { data, error } = await supabaseAdmin
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: user.id,
        role_in_group: role,
        joined_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


/**
 * @swagger
 * /group/{id}/members/{userId}:
 *   delete:
 *     summary: Xóa thành viên khỏi group
 *     description: >
 *       Xóa một user khỏi group theo groupId và userId.
 *       Chỉ owner hoặc admin của group mới có quyền thực hiện.
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của group
 *         schema:
 *           type: string
 *           example: "f1a3b9d2-8c4a-4e9a-b123-abc456789000"
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID của user cần xóa khỏi group
 *         schema:
 *           type: string
 *           example: "a912bc34-1122-4455-8899-acde12345678"
 *     responses:
 *       200:
 *         description: Xóa thành viên thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Member removed
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền xóa thành viên
 *       404:
 *         description: Thành viên không tồn tại trong group
 */

export const deleteMember = async (req, res) => {
  const { id, userId } = req.params;

  await supabaseAdmin
    .from("group_members")
    .delete()
    .eq("group_id", id)
    .eq("user_id", userId);

  res.json({ message: "Member removed" });
};

/**
 * @swagger
 * /group/{id}/members/search:
 *   get:
 *     summary: Tìm thành viên theo username trong group
 *     description: >
 *       Tìm kiếm thành viên trong group theo username (không phân biệt hoa thường).
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của group
 *         schema:
 *           type: string
 *           example: "f1a3b9d2-8c4a-4e9a-b123-abc456789000"
 *       - in: query
 *         name: keyword
 *         required: false
 *         description: Username cần tìm
 *         schema:
 *           type: string
 *           example: duc
 *     responses:
 *       200:
 *         description: Danh sách thành viên phù hợp
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   users:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập group
 *       404:
 *         description: Group không tồn tại
 */

export const getGroupsMemberByName = async (req, res) => {
  const groupId = req.params.id;
  const { keyword = "" } = req.query;

  const { data, error } = await supabaseAdmin
    .from("group_members")
    .select(`users:user_id (id, username, email)`)
    .eq("group_id", groupId)
    .ilike("users.username", `%${keyword}%`);

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
};

/**
 * @swagger
 * /group/{id}:
 *   get:
 *     summary: Lấy chi tiết một group theo ID
 *     description: >
 *       Trả về thông tin chi tiết của group theo ID.
 *       User phải là thành viên của group.
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của group
 *         schema:
 *           type: string
 *           example: "f1a3b9d2-8c4a-4e9a-b123-abc456789000"
 *     responses:
 *       200:
 *         description: Thông tin chi tiết group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 imageurl:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 role:
 *                   type: string
 *                   example: member
 *                 total_members:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: User không thuộc group
 *       404:
 *         description: Group không tồn tại
 */
export const getGroupById = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;

    // 1️⃣ Check user có thuộc group không + lấy role
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("group_members")
      .select("role_in_group")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError) {
      return res.status(400).json({ error: memberError.message });
    }

    if (!membership) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // 2️⃣ Lấy thông tin group
    const { data: group, error: groupError } = await supabaseAdmin
      .from("groups")
      .select("id, name, description, imageurl, created_at")
      .eq("id", groupId)
      .single();

    if (groupError) {
      return res.status(404).json({ error: "Group not found" });
    }

    // 3️⃣ Đếm số thành viên
    const { count } = await supabaseAdmin
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId);

    return res.json({
      ...group,
      role: membership.role_in_group,
      total_members: count || 0,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
