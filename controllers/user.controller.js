const User = require("../models/user.model");
const AppError = require("../utils/AppError");

// ─── Get all users ────────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get one user ─────────────────────────────────────────────────────────────
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError("User not found.", 404));

    res.status(200).json({ status: "success", data: { user } });
  } catch (error) {
    next(error);
  }
};

// ─── Update user ──────────────────────────────────────────────────────────────
exports.updateUser = async (req, res, next) => {
  try {
    // Prevent password change through this route
    const { password, role, ...updateData } = req.body;

    // Only super-admin can change roles
    if (req.user.role === "super-admin" && role) {
      updateData.role = role;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!user) return next(new AppError("User not found.", 404));

    res.status(200).json({ status: "success", data: { user } });
  } catch (error) {
    next(error);
  }
};

// ─── Delete user ──────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new AppError("User not found.", 404));

    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    next(error);
  }
};

// ─── Get me (current user profile) ───────────────────────────────────────────
exports.getMe = (req, res) => {
  res.status(200).json({ status: "success", data: { user: req.user } });
};
