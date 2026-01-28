require("dotenv").config();
const express = require("express");
const cors = require("cors");

// 🔹 Firebase / DB init (must be at the top)
require("./config/db");

const app = express();

// =======================
// MIDDLEWARES
// =======================
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://fayzullaevieltsschool.netlify.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

app.use(express.json());

// =======================
// ROUTES
// =======================
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/users");
const pendingUsersRoutes = require("./routes/pendingUsers");
const groupRoutes = require("./routes/groups");
const attendanceRoutes = require("./routes/attendance");
const paymentRoutes = require("./routes/payments");
const approveUserRoutes = require("./routes/approveUser");
const rejectUserRoutes = require("./routes/rejectUser");

// =======================
// ROUTE BINDINGS
// =======================
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users/pending", pendingUsersRoutes);
app.use("/api/admin/approve-user", approveUserRoutes);
app.use("/api/admin/reject-user", rejectUserRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);

// =======================
// TEST ROUTE
// =======================
app.get("/", (req, res) => {
  res.send("API working ✅");
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
});

// =======================
// TELEGRAM BOT
// =======================
require("./bot"); // bot.js ishga tushadi