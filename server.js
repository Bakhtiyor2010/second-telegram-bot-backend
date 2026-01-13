require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const User = require("./models/User");
const bot = require("./bot"); // Telegram bot

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// Test route
app.get("/", (req, res) => res.send("API working ✅"));

// Userni o‘chirish + Telegram xabar
app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await User.findByIdAndDelete(req.params.id);

    // Telegram xabar yuborish
    bot.sendMessage(user.telegramId, "❌ Sizning ma’lumotlaringiz admin tomonidan o‘chirildi.")
      .catch(err => console.error("Telegram message error:", err.message));

    res.json({ message: "User deleted and notified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Bulk Telegram message
app.post("/api/send-message", async (req, res) => {
  const { userIds, message } = req.body;

  if (!userIds || !message) {
    return res.status(400).json({ error: "userIds or message missing" });
  }

  try {
    const users = await User.find({ _id: { $in: userIds } });

    // Barcha xabarlarni parallel yuborish
    const results = await Promise.allSettled(users.map(user =>
      bot.sendMessage(user.telegramId, message)
        .then(() => ({ user: `${user.name} ${user.surname}`, status: "Sent" }))
        .catch(() => ({ user: `${user.name} ${user.surname}`, status: "Failed" }))
    ));

    res.json({ results: results.map(r => r.value) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// MongoDB ulanish va server ishga tushirish
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