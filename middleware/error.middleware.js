const AppError = require("../utils/AppError");

// ─── Handle specific Mongoose / JWT errors ────────────────────────────────────
const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}.`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(`${field} "${value}" already exists.`, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${errors.join(". ")}`, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please log in again.", 401);

// ─── Send error response ──────────────────────────────────────────────────────
const sendError = (err, res) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // Production: only send operational error messages
  if (err.isOperational) {
    return res.status(statusCode).json({ status, message: err.message });
  }

  console.error("💥 UNEXPECTED ERROR:", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong. Please try again later.",
  });
};

// ─── Global error middleware ──────────────────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message };

  if (err.name === "CastError") error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === "ValidationError") error = handleValidationErrorDB(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  sendError(error, res);
};

module.exports = globalErrorHandler;
