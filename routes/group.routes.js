const express = require("express");
const router = express.Router();
const groupController = require("../controllers/group.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const {
  validateCreateGroup,
  validateUpdateGroup,
  validateUserId,
  validatePermission,
} = require("../validation/group.validation");

// All group routes require authentication
router.use(protect);

router
  .route("/")
  .get(groupController.getAllGroups)
  .post(validateCreateGroup, groupController.createGroup);

router
  .route("/:id")
  .get(groupController.getGroup)
  .patch(validateUpdateGroup, groupController.updateGroup)
  .delete(groupController.deleteGroup);

// Member management (admin only)
router.post("/:id/members", validateUserId, groupController.addMember);
router.delete("/:id/members", validateUserId, groupController.removeMember);

// Promote to admin
router.post("/:id/admins", validateUserId, groupController.addAdmin);

// Manage post permissions
router.patch("/:id/permissions", validatePermission, groupController.managePermission);

module.exports = router;
