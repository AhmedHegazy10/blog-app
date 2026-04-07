const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

// All user routes require authentication
router.use(protect);

router.get("/me", userController.getMe);

router
  .route("/")
  .get(restrictTo("admin", "super-admin"), userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(restrictTo("admin", "super-admin"), userController.updateUser)
  .delete(restrictTo("admin", "super-admin"), userController.deleteUser);

module.exports = router;
