require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const groupRoutes = require("./routes/groups");
const attendanceRoutes = require("./routes/attendance"); // attendance
const bot = require("./bot"); // Telegram bot

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/attendance", attendanceRoutes);

// Test route
app.get("/", (req, res) => res.send("API working ✅"));

// Bulk Telegram message
app.post("/api/send-message", async (req, res) => {
  const { userIds, message } = req.body;
  if (!userIds || !message) return res.status(400).json({ error: "userIds or message missing" });

  try {
    const users = await require("./models/User").find({ _id: { $in: userIds } });
    const results = await Promise.allSettled(
      users.map(user => {
        const text = `Assalomu alaykum, hurmatli ${user.name || ""} ${user.surname || ""}\n\n${message}`;
        return bot.sendMessage(user.telegramId, text)
          .then(() => ({ user: `${user.name} ${user.surname}`, status: "Sent" }))
          .catch(() => ({ user: `${user.name} ${user.surname}`, status: "Failed" }));
      })
    );
    res.json({ results: results.map(r => r.value) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
const startServer = async () => {
  try {
    await connectDB(); // db.js dagi connectDB()
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT} ✅`));
  } catch (err) {
    console.error("Server start error:", err.message);
    process.exit(1);
  }
};

startServer();
