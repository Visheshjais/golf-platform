// ============================================================
// config/db.js — MongoDB Atlas connection via Mongoose
// ============================================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options suppress deprecation warnings in Mongoose 7+
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Kill server if DB connection fails
  }
};

module.exports = connectDB;
