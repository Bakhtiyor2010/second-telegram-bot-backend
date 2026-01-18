const express = require("express");
const router = express.Router();
const usersCollection = require("../models/User");
const { addAttendance, getAllAttendance } = require("../models/attendanceService");
const bot = require("../bot");
const admin = require("firebase-admin");
const db = admin.firestore();

// POST /api/attendance — mark attendance + bot xabar
router.post("/", async (req, res) => {
  try {
    const { userId, status, message } = req.body;
    if (!userId) return res.status(400).json({ error: "No users selected" });

    const ids = Array.isArray(userId) ? userId : [userId];
    let sentCount = 0;

    for (const id of ids) {
      const userDoc = await usersCollection.doc(String(id)).get();
      if (!userDoc.exists) continue;

      const u = userDoc.data();
      if (!u.telegramId || u.status !== "active") continue;

      // 🔹 Attendance history saqlash
      if (status) {
        await addAttendance(u.telegramId, status, u.name, u.surname);
      }

      // 🔹 Telegram xabar
      let msg = message;
      if (!msg && status) {
        msg = `Assalomu alaykum, ${u.name || ""} ${u.surname || ""}.\nBugun darsda ${
          status === "present" ? "QATNASHDI" : "QATNASHMADI"
        }.\nSana: ${new Date().toLocaleDateString("en-GB")}`;
      }

      await bot.sendMessage(u.telegramId, msg);
      sentCount++;
    }

    res.json({ message: "Messages sent ✅", sent: sentCount });
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/attendance — barcha attendance
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
