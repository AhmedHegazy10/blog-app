require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

// ─── Unhandled Rejection / Uncaught Exception Guards ─────────────────────────
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// ─── Connect to DB then start server ─────────────────────────────────────────
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
