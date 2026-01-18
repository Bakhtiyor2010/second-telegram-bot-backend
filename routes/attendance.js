const express = require("express");
const router = express.Router();
const usersCollection = require("../models/User"); // Firestore users
const { addAttendance, getAllAttendance } = require("../models/attendanceService");
const bot = require("../bot");

// 🔹 Attendance + Telegram xabar
router.post("/", async (req, res) => {
  try {
    const { userId, status, message } = req.body;
    if (!userId) return res.status(400).json({ error: "No users selected" });

    const ids = Array.isArray(userId) ? userId : [userId];
    let sentCount = 0;

    for (const id of ids) {
      // 🔹 Firestore query orqali Telegram ID bo‘yicha topish
      const snap = await usersCollection.where("id", "==", id).limit(1).get();
      if (snap.empty) continue;

      const doc = snap.docs[0];
      const u = doc.data();
      if (!u.telegramId || u.status !== "active") continue;

      // 🔹 Attendance qo‘shish
      if (status) {
        await addAttendance(u.telegramId, status, u.name, u.surname);
      }

      // 🔹 Telegram xabar
      let msg = message;
      if (!msg && status) {
        msg = `Assalomu alaykum, hurmatli ${u.name || ""} ${u.surname || ""}!
Bugun darsda ${status === "present" ? "QATNASHDI" : "QATNASHMADI"}.
Sana: ${new Date().toLocaleDateString("en-GB")}`;
      }

      try {
        await bot.sendMessage(u.telegramId, msg);
        sentCount++;
      } catch (err) {
        console.error(`Telegram xabar yuborilmadi: ${u.telegramId}`, err.message);
      }
    }

    res.json({ message: "Attendance saved and messages sent ✅", sent: sentCount });
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/attendance
router.get("/", async (req, res) => {
  try {
    const attendance = await getAllAttendance();
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load attendance" });
  }
});

module.exports = router;