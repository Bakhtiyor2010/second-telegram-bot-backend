require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Routes
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/users");
const groupRoutes = require("./routes/groups");
const attendanceRoutes = require("./routes/attendance");

const app = express();

// CORS middleware
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://fayzullaevieltsschool.netlify.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// JSON parse middleware
app.use(express.json());

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/attendance", attendanceRoutes);

// Test route
app.get("/", (req, res) => res.send("API working ✅"));

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} ✅`));