const express = require("express");
const router = express.Router();
const { addAttendance, getAllAttendance } = require("../models/attendanceService");
const usersCollection = require("../models/User");
const bot = require("../bot");

// POST /api/attendance
router.post("/", async (req, res) => {
  try {
    const { userId, status, message, adminUsername } = req.body; // <-- frontend dan keladi

    if (!userId) return res.status(400).json({ error: "No users selected" });

    const ids = Array.isArray(userId) ? userId : [userId];
    let sentCount = 0;

    for (const id of ids) {
      const userDoc = await usersCollection.doc(String(id)).get();
      if (!userDoc.exists) continue;

      const u = userDoc.data();
      if (u.status !== "active" || !u.telegramId) continue;

      // Attendance qo‘shish
      if (status) {
        await addAttendance(
          u.telegramId,
          status,
          u.name || "",
          u.surname || "",
          u.phone || "",
          u.groupName || "",
          adminUsername || "Admin" // <-- backend da saqlanadi
        );
      }

      // Telegram xabar
      let msg = message;
      if (!msg && status) {
        msg = `Assalomu alaykum, ${u.name || ""} ${u.surname || ""} bugun darsda ${
          status === "present" ? "QATNASHDI" : "QATNASHMADI"
        } (Sana: ${new Date().toLocaleDateString("en-GB")}).\n\n
Здравствуйте, ${u.name || ""} ${u.surname || ""}, сегодня на занятии вы ${
          status === "present" ? "ПРИСУТСТВОВАЛИ" : "НЕ ПРИСУТСТВОВАЛИ"
        } (Дата: ${new Date().toLocaleDateString("en-GB")}).`;
      }

      if (!msg) continue;

      try {
        await bot.sendMessage(u.telegramId, msg);
        sentCount++;
      } catch (err) {
        console.error("Telegram message failed:", err);
      }
    }

    res.json({ message: "Attendance processed", sent: sentCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/attendance
router.get("/", async (req, res) => {
  try {
    const history = await getAllAttendance();
    res.json(history); // <-- admin username shu yerda ko‘rinadi
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load attendance" });
  }
});

module.exports = router;
