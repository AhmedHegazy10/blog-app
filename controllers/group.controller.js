const Group = require("../models/group.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");

// ─── Create group ─────────────────────────────────────────────────────────────
exports.createGroup = async (req, res, next) => {
  try {
    const { name, description, openPosting } = req.body;

    const group = await Group.create({
      name,
      description,
      admins: [req.user._id],   // Creator is the first admin
      members: [req.user._id],  // Creator is also a member
      openPosting: openPosting || false,
    });

    await group.populate("admins", "username email");

    res.status(201).json({ status: "success", data: { group } });
  } catch (error) {
    next(error);
  }
};

// ─── Get all groups ───────────────────────────────────────────────────────────
exports.getAllGroups = async (req, res, next) => {
  try {
    const groups = await Group.find()
      .populate("admins", "username email")
      .populate("members", "username email");

    res.status(200).json({
      status: "success",
      results: groups.length,
      data: { groups },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get single group ─────────────────────────────────────────────────────────
exports.getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("admins", "username email")
      .populate("members", "username email")
      .populate("allowedToPost", "username email");

    if (!group) return next(new AppError("Group not found.", 404));

    res.status(200).json({ status: "success", data: { group } });
  } catch (error) {
    next(error);
  }
};

// ─── Update group ─────────────────────────────────────────────────────────────
exports.updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    // Only group admins or super-admin
    const isAdmin = group.admins.some(
      (a) => a.toString() === req.user._id.toString()
    );
    if (!isAdmin && req.user.role !== "super-admin") {
      return next(new AppError("Only group admins can update this group.", 403));
    }

    const updated = await Group.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ status: "success", data: { group: updated } });
  } catch (error) {
    next(error);
  }
};

// ─── Delete group ─────────────────────────────────────────────────────────────
exports.deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    const isAdmin = group.admins.some(
      (a) => a.toString() === req.user._id.toString()
    );
    if (!isAdmin && req.user.role !== "super-admin") {
      return next(new AppError("Only group admins can delete this group.", 403));
    }

    await Group.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    next(error);
  }
};

// ─── Helper: verify caller is group admin ─────────────────────────────────────
const requireGroupAdmin = (group, userId, userRole) => {
  if (userRole === "super-admin") return;
  const isAdmin = group.admins.some((a) => a.toString() === userId.toString());
  if (!isAdmin) throw new AppError("Only group admins can perform this action.", 403);
};

// ─── Add member ───────────────────────────────────────────────────────────────
exports.addMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    requireGroupAdmin(group, req.user._id, req.user.role);

    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return next(new AppError("User not found.", 404));

    if (group.isMember(userId)) {
      return next(new AppError("User is already a member.", 400));
    }

    group.members.push(userId);
    await group.save();
    await group.populate("members", "username email");

    res.status(200).json({ status: "success", data: { group } });
  } catch (error) {
    next(error);
  }
};

// ─── Remove member ────────────────────────────────────────────────────────────
exports.removeMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    requireGroupAdmin(group, req.user._id, req.user.role);

    const { userId } = req.body;

    // Cannot remove an admin through this route
    const isAdmin = group.admins.some((a) => a.toString() === userId);
    if (isAdmin) {
      return next(new AppError("Cannot remove an admin as a member. Demote first.", 400));
    }

    group.members = group.members.filter((m) => m.toString() !== userId);
    group.allowedToPost = group.allowedToPost.filter((u) => u.toString() !== userId);
    await group.save();

    res.status(200).json({ status: "success", data: { group } });
  } catch (error) {
    next(error);
  }
};

// ─── Manage post permission ───────────────────────────────────────────────────
exports.managePermission = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    requireGroupAdmin(group, req.user._id, req.user.role);

    const { userId, canPost } = req.body;

    if (!group.isMember(userId)) {
      return next(new AppError("User is not a member of this group.", 400));
    }

    const alreadyAllowed = group.allowedToPost.some(
      (u) => u.toString() === userId
    );

    if (canPost && !alreadyAllowed) {
      group.allowedToPost.push(userId);
    } else if (!canPost && alreadyAllowed) {
      group.allowedToPost = group.allowedToPost.filter(
        (u) => u.toString() !== userId
      );
    }

    await group.save();
    res.status(200).json({ status: "success", data: { group } });
  } catch (error) {
    next(error);
  }
};

// ─── Add admin ────────────────────────────────────────────────────────────────
exports.addAdmin = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return next(new AppError("Group not found.", 404));

    requireGroupAdmin(group, req.user._id, req.user.role);

    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return next(new AppError("User not found.", 404));

    if (!group.isMember(userId)) {
      return next(new AppError("User must be a member first.", 400));
    }

    const isAlreadyAdmin = group.admins.some((a) => a.toString() === userId);
    if (isAlreadyAdmin) return next(new AppError("User is already an admin.", 400));

    group.admins.push(userId);
    await group.save();
    await group.populate("admins", "username email");

    res.status(200).json({ status: "success", data: { group } });
  } catch (error) {
    next(error);
  }
};
