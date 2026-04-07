require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

// ─── Unhandled Rejection / Uncaught Exception Guards ─────────────────────────
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// ─── Local development ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  connectDB().then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });

    process.on("unhandledRejection", (err) => {
      console.error("💥 UNHANDLED REJECTION! Shutting down...");
      console.error(err.name, err.message);
      server.close(() => process.exit(1));
    });
  });
} else {
  // ─── Vercel Serverless ──────────────────────────────────────────────────────
  connectDB();
}

module.exports = app;