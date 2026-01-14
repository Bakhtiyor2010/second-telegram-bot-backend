require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Routes
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const groupRoutes = require("./routes/groups");
const attendanceRoutes = require("./routes/attendance");
const paymentRoutes = require("./routes/payment");

// Middleware
const attachAdmin = require("./middlewares/auth"); // faqat protected route uchun
const bot = require("./bot"); // Telegram bot

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

// JSON parse middleware
app.use(express.json());

// Public route (login)
app.use("/api/admin", adminRoutes); // login POST route shu yerda bo‘ladi, middleware yo‘q

// Protected routes example
// app.use("/api/admin/protected", attachAdmin, protectedAdminRoutes);

// Other routes
app.use("/api/users", attachAdmin, userRoutes);
app.use("/api/groups", attachAdmin, groupRoutes);
app.use("/api/attendance", attachAdmin, attendanceRoutes);
app.use("/api/payment", attachAdmin, paymentRoutes);

// Test route
app.get("/", (req, res) => res.send("API working ✅"));

// Telegram bulk message
app.post("/api/send-message", attachAdmin, async (req, res) => {
  const { userIds, message } = req.body;
  if (!userIds || !message) return res.status(400).json({ error: "userIds or message missing" });

  try {
    const User = require("./models/User");
    const users = await User.find({ _id: { $in: userIds } });

    const results = await Promise.allSettled(
      users.map(user => {
        const text =
          `Assalomu alaykum, hurmatli ${user.name || ""} ${user.surname || ""}\n\n${message}`;
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
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT} ✅`));
  } catch (err) {
    console.error("Server start error:", err.message);
    process.exit(1);
  }
};

startServer();
