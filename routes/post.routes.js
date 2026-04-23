const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const { protect, optionalProtect } = require("../middleware/auth.middleware");
const { multerUpload, uploadOnImageKit } = require("../middleware/upload.middleware");
const {
  validateCreatePost,
  validateUpdatePost,
  validateComment,
} = require("../validation/post.validation");

router
  .route("/")
  .get(optionalProtect, postController.getAllPosts)
  .all(protect)
  .post(
    multerUpload,
    uploadOnImageKit,
    validateCreatePost,
    postController.createPost
  );

router.use(protect);

router.get("/user/:userId", postController.getUserPosts);
router.get("/my-posts", postController.getUserPosts);

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

router.post("/:id/like", postController.toggleLike);
router.post("/:id/comments", validateComment, postController.addComment);
router.delete("/:id/comments/:commentId", postController.deleteComment);

module.exports = router;
