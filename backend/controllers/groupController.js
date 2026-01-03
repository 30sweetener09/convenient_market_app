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

  const { data, error } = await supabase
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

  const { data, error } = await supabase
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
      role_group_id: 1,
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
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 */
export const getGroupMembers = async (req, res) => {
  const groupId = req.params.id;

  const { data, error } = await supabase
    .from("group_members")
    .select(`
      role_in_group,
      joined_at,
      users:user_id (id, username, email, photourl)
    `)
    .eq("group_id", groupId);

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
};

/**
 * @swagger
 * /group/{id}/members:
 *   post:
 *     summary: Thêm thành viên vào group
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 */
export const addMember = async (req, res) => {
  const groupId = req.params.id;
  const { userId, role = "member" } = req.body;

  const { data: exists } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (exists) return res.status(400).json({ error: "Member already exists" });

  const { data, error } = await supabaseAdmin
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: userId,
      role_in_group: role,
      joined_at: new Date(),
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
};

/**
 * @swagger
 * /group/{id}/members/{userId}:
 *   delete:
 *     summary: Xóa thành viên khỏi group
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
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
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 */
export const getGroupsMemberByName = async (req, res) => {
  const groupId = req.params.id;
  const { keyword = "" } = req.query;

  const { data, error } = await supabase
    .from("group_members")
    .select(`users:user_id (id, username, email)`)
    .eq("group_id", groupId)
    .ilike("users.username", `%${keyword}%`);

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
};
