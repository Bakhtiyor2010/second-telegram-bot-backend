const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI .env faylida topilmadi!");
    }

    // Mongoose 7 da useNewUrlParser va useUnifiedTopology kerak emas
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected ✅");
  } catch (error) {
    console.error("MongoDB connection error ❌:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;