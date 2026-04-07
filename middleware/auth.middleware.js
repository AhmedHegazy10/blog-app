const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");

// ─── Protect: verify JWT and attach user to req ───────────────────────────────
const protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("You are not logged in. Please log in to get access.", 401));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError("The user belonging to this token no longer exists.", 401));
    }

    // 4) Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Your token has expired. Please log in again.", 401));
    }
    next(error);
  }
};

// ─── RestrictTo: role-based access control ────────────────────────────────────
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Super admin bypasses all restrictions
    if (req.user.role === "super-admin") return next();

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo };
