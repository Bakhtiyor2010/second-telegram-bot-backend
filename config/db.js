const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI .env faylida topilmadi!");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("MongoDB connected ✅");
  } catch (error) {
    console.error("MongoDB connection error ❌:", error.message);
    process.exit(1); // serverni to‘xtatadi
  }
};

module.exports = connectDB;