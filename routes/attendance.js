const express = require("express");
const router = express.Router();
const usersCollection = require("../models/User"); // faqat TASDIQLANGAN userlar
const { saveAttendance } = require("../models/attendanceService");
const bot = require("../bot");

// Attendance / Telegram xabar yuborish
router.post("/", async (req, res) => {
  try {
    const { userId, status, message } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "No users selected" });
    }

    // userId bitta yoki array bo‘lishi mumkin
    const ids = Array.isArray(userId) ? userId : [userId];

    let sentCount = 0;

    for (const id of ids) {
      // 🔐 Faqat users collection tekshiriladi
      const userDoc = await usersCollection.doc(String(id)).get();

      if (!userDoc.exists) continue;

      const u = userDoc.data();

      if (!u.telegramId || u.status !== "active") {
        continue;
      }

      // 🔹 1. ATTENDANCE HISTORY SAQLASH (YANGI QO‘SHILDI)
      if (status) {
        await saveAttendance({
          userId: u.telegramId,
          status,
        });
      }

      // 🔹 2. DEFAULT MESSAGE (ESKI LOGIKA)
      let msg = message;

      if (!msg && status) {
        msg = `Assalomu alaykum, ${u.name || ""} ${u.surname || ""}.
Bugun darsda ${
          status === "present" ? "QATNASHDI" : "QATNASHMADI"
        }.
Sana: ${new Date().toLocaleDateString("en-GB")}`;
      }

      // 🔹 3. TELEGRAMGA YUBORISH
      await bot.sendMessage(u.telegramId, msg);
      sentCount++;
    }

    res.json({
      message: "Messages sent ✅",
      sent: sentCount,
    });
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;