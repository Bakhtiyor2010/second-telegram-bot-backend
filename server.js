require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

/* =======================
   MIDDLEWARES
======================= */
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

/* =======================
   ROUTES
======================= */
// Admin & Auth
const adminRoutes = require("./routes/admin");

// Users
const userRoutes = require("./routes/users");
const pendingUsersRoutes = require("./routes/pendingUsers");

// Groups
const groupRoutes = require("./routes/groups");

// Attendance (faqat approved users)
const attendanceRoutes = require("./routes/attendance");

// Payments
const paymentRoutes = require("./routes/payments");

// Admin approval
const approveUserRoutes = require("./routes/approveUser");
const rejectUserRoutes = require("./routes/rejectUser");

/* =======================
   ROUTE BINDINGS
======================= */
app.use("/api/admin", adminRoutes);

// Users
app.use("/api/users", userRoutes);
app.use("/api/users/pending", pendingUsersRoutes);

// Approval
app.use("/api/admin/approve-user", approveUserRoutes);
app.use("/api/admin/reject-user", rejectUserRoutes);

// Other modules
app.use("/api/groups", groupRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);

/* =======================
   TEST
======================= */
app.get("/", (req, res) => {
  res.send("API working ✅");
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
});

/* =======================
   TELEGRAM BOT
======================= */
require("./bot"); // <-- bot.js ni chaqiramiz va ishga tushiramiz
