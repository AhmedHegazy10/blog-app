const mongoose = require("mongoose");

let cachedConnection = null;
let pendingConnection = null;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  if (cachedConnection || mongoose.connection.readyState === 1) {
    return cachedConnection || mongoose.connection;
  }

  if (pendingConnection) {
    return pendingConnection;
  }

  pendingConnection = mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    })
    .then((conn) => {
      cachedConnection = conn.connection;
      pendingConnection = null;
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return cachedConnection;
    })
    .catch((error) => {
      pendingConnection = null;
      console.error(`MongoDB connection error: ${error.message}`);
      throw error;
    });

  return pendingConnection;
};

module.exports = connectDB;
