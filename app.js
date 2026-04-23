const express = require("express");
const rateLimit = require("express-rate-limit");
const globalErrorHandler = require("./middleware/error.middleware");
const AppError = require("./utils/AppError");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const postRoutes = require("./routes/post.routes");
const groupRoutes = require("./routes/group.routes");

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting (Bonus Feature) ───────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // Max 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use("/api", limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/groups", groupRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Blog App API is running 🚀",
    version: "1.0.0",
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
