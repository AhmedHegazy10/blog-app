const multer = require("multer");
const AppError = require("../utils/AppError");
const { uploadMultipleToImageKit } = require("../utils/imagekit");

// Store files in memory (buffer) — we send to ImageKit, not disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Only image files are allowed.", 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10,                  // Max 10 images per post
  },
});

// ─── Multer middleware: accept up to 10 images field "images" ─────────────────
const multerUpload = upload.array("images", 10);

// ─── Custom middleware: upload buffered files to ImageKit ─────────────────────
const uploadOnImageKit = async (req, res, next) => {
  try {
    // If no files attached, skip (validation will catch missing images)
    if (!req.files || req.files.length === 0) return next();

    const urls = await uploadMultipleToImageKit(req.files, "/blog/posts");
    req.imageUrls = urls; // Attach URLs to request
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { multerUpload, uploadOnImageKit };
