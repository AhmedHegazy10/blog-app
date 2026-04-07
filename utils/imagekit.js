const ImageKit = require("imagekit");
const AppError = require("./AppError");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Upload a single file buffer to ImageKit
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - Original file name
 * @param {string} folder - Destination folder in ImageKit
 * @returns {Promise<string>} - Uploaded image URL
 */
const uploadToImageKit = async (fileBuffer, fileName, folder = "/blog") => {
  try {
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: `${Date.now()}-${fileName}`,
      folder,
    });
    return response.url;
  } catch (error) {
    throw new AppError(`Image upload failed: ${error.message}`, 500);
  }
};

/**
 * Upload multiple files to ImageKit
 * @param {Array} files - Array of multer file objects
 * @param {string} folder - Destination folder in ImageKit
 * @returns {Promise<string[]>} - Array of uploaded image URLs
 */
const uploadMultipleToImageKit = async (files, folder = "/blog") => {
  const uploadPromises = files.map((file) =>
    uploadToImageKit(file.buffer, file.originalname, folder)
  );
  return Promise.all(uploadPromises);
};

module.exports = { imagekit, uploadToImageKit, uploadMultipleToImageKit };
