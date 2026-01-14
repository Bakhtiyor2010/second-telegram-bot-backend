require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const groupRoutes = require("./routes/groups");
const attendanceRoutes = require("./routes/attendance");
const paymentRoutes = require("./routes/payment");
const bot = require("./bot");
const attachAdmin = require("./middlewares/auth"); // Admin attach

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  credentials: true
}));

app.use(express.json());
app.use(attachAdmin); // req.admin ni attach qiladi

// Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payment", paymentRoutes);

// Test route
app.get("/", (req, res) => res.send("API working ✅"));

// Bulk Telegram message
app.post("/api/send-message", async (req, res) => {
  const { userIds, message } = req.body;
  if (!userIds || !message) {
    return res.status(400).json({ error: "userIds or message missing" });
  }

  try {
    const User = require("./models/User");
    const users = await User.find({ _id: { $in: userIds } });

    const results = await Promise.allSettled(
      users.map(user => {
        const text =
          `Assalomu alaykum, hurmatli ${user.name || ""} ${user.surname || ""}\n\n${message}`;
        return bot.sendMessage(user.telegramId, text)
          .then(() => ({
            user: `${user.name} ${user.surname}`,
            status: "Sent"
          }))
          .catch(() => ({
            user: `${user.name} ${user.surname}`,
            status: "Failed"
          }));
      })
    );

    res.json({ results: results.map(r => r.value) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

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