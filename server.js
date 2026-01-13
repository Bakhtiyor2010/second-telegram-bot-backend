require("dotenv").config();
require("./bot"); // bot ishga tushadi

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/users");
const User = require("./models/User");
const bot = require("./bot"); // bot.js faylidan TelegramBot import

const app = express();
connectDB();

// CORS barcha originlarga ruxsat
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);

// DELETE foydalanuvchi
app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    res.json({ message: "Foydalanuvchi o‘chirildi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// PUT (update) endpoint (hozir ishlatilmaydi, xohlasangiz saqlab qo‘yish mumkin)
app.put("/api/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// Telegram xabar yuborish endpoint
app.post("/api/send-message", async (req, res) => {
  const { userIds, message } = req.body;

  if (!userIds || !message) {
    return res.status(400).json({ error: "Userlar yoki xabar bo‘sh bo‘lishi mumkin emas" });
  }

  try {
    const users = await User.find({ _id: { $in: userIds } });

    const sendResults = [];
    for (const user of users) {
      try {
        await bot.sendMessage(user.telegramId, message);
        sendResults.push({ user: user.name + " " + user.surname, status: "Yuborildi" });
      } catch (err) {
        console.error(`Xato ${user.name}:`, err);
        sendResults.push({ user: user.name + " " + user.surname, status: "Xato" });
      }
    }

    res.json({ results: sendResults });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

app.get("/", (req, res) => {
  res.send("API working");
});

const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});