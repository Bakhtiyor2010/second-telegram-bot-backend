require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Routes
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/users");
const groupRoutes = require("./routes/groups");
const attendanceRoutes = require("./routes/attendance");
const paymentRoutes = require("./routes/payment");

const app = express();

// CORS middleware
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://fayzullaevieltsschool.netlify.app"
  ],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"]
}));

// JSON parse
app.use(express.json());

// Public login route
app.use("/api/admin", adminRoutes);

// Boshqa routelar (agar middleware kerak bo‘lsa, keyin qo‘shish mumkin)
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payment", paymentRoutes);

// Test route
app.get("/", (req, res) => res.send("API working ✅"));

// Server start
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT} ✅`));
  } catch (err) {
    console.error("Server start error:", err.message);
    process.exit(1);
  }
};

startServer();
