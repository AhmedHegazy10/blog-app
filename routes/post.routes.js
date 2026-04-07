const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const { protect } = require("../middleware/auth.middleware");
const { multerUpload, uploadOnImageKit } = require("../middleware/upload.middleware");
const {
  validateCreatePost,
  validateUpdatePost,
  validateComment,
} = require("../validation/post.validation");

// All post routes require authentication
router.use(protect);

router
  .route("/")
  .get(postController.getAllPosts)
  .post(
    multerUpload,           // 1. Accept files via multer
    uploadOnImageKit,       // 2. Upload to ImageKit → req.imageUrls
    validateCreatePost,     // 3. Validate body fields
    postController.createPost
  );

// User-specific posts
router.get("/user/:userId", postController.getUserPosts);
router.get("/my-posts", postController.getUserPosts); // uses req.user._id

router
  .route("/:id")
  .get(postController.getPost)
  .patch(
    multerUpload,
    uploadOnImageKit,
    validateUpdatePost,
    postController.updatePost
  )
  .delete(postController.deletePost);

// Bonus: Likes & Comments
router.post("/:id/like", postController.toggleLike);
router.post("/:id/comments", validateComment, postController.addComment);
router.delete("/:id/comments/:commentId", postController.deleteComment);

module.exports = router;
