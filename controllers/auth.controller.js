const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");

// ─── Generate JWT ─────────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Prevent self-assigning super-admin through register
    const safeRole = role === "super-admin" ? "user" : role;

    const user = await User.create({ username, email, password, role: safeRole });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field included
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Incorrect email or password.", 401));
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
