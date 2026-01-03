// middlewares/uploadMiddleware.js
import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)"));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

export const uploadMiddleware = upload.single("image");
