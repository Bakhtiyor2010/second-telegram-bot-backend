require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

// Routes
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/users");
const groupRoutes = require("./routes/groups");
const attendanceRoutes = require("./routes/attendance");
const paymentRoutes = require("./routes/payments"); // ✅ QO‘SHILDI

// Cron
const clearExpiredPayments = require("./cron/clearExpiredPayments");

const app = express();

// CORS
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://fayzullaevieltsschool.netlify.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json());

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes); // ✅ MUHIM

// Test
app.get("/", (req, res) => res.send("API working ✅"));

// 🔁 CRON — har kuni 00:00 da
cron.schedule("0 0 * * *", clearExpiredPayments);

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT} ✅`)
);