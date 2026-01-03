// services/uploadService.js
import { supabase } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export const uploadImageToSupabase = async (file) => {
  if (!file) return null;

  const fileExt = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExt}`;
  const filePath = `recipe/${fileName}`;

  const { data, error } = await supabase.storage
    .from("recipe-images")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("recipe-images")
    .getPublicUrl(filePath);

  return {
    url: publicUrlData.publicUrl,
    path: filePath, // Lưu path để có thể xóa sau này
  };
};

export const deleteImageFromSupabase = async (filePath) => {
  if (!filePath) return;

  const { error } = await supabase.storage
    .from("recipe-images")
    .remove([filePath]);

  if (error) {
    console.error("Delete image error:", error);
  }
};
