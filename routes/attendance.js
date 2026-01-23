const express = require("express");
const router = express.Router();

const usersCollection = require("../models/User"); // faqat TASDIQLANGAN userlar
const {
  addAttendance,
  getAllAttendance,
} = require("../models/attendanceService");
const bot = require("../bot");

/**
 * POST /api/attendance
 * Attendance + Telegram xabar
 */
router.post("/", async (req, res) => {
  try {
    const { userId, status, message } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "No users selected" });
    }

    // Agar status ham message ham bo‘lmasa — hech narsa qilinmaydi
    if (!status && !message) {
      return res.status(400).json({ error: "Status or message required" });
    }

    const ids = Array.isArray(userId) ? userId : [userId];
    let sentCount = 0;

    for (const id of ids) {
      const userDoc = await usersCollection.doc(String(id)).get();
      if (!userDoc.exists) continue;

      const u = userDoc.data();

      // faqat active va telegramId bor userlar
      if (u.status !== "active" || !u.telegramId) continue;

      // =====================
      // Attendance history
      // =====================
      if (status) {
        await addAttendance(
          u.telegramId,
          status,
          u.name || "",
          u.surname || "",
          u.phone || "",
          u.groupName || "",
          req.user?.username || "Admin",
        );
      }

      // =====================
      // Telegram message
      // =====================
      let msg = message;

      if (!msg && status) {
        msg = `Assalomu alaykum, ${u.name || ""} ${u.surname || ""} bugun darsda ${
          status === "present" ? "QATNASHDI" : "QATNASHMADI"
        } (Sana: ${new Date().toLocaleDateString("en-GB")}).
        
Здравствуйте, ${u.name || ""} ${u.surname || ""}, сегодня на занятии вы ${status === "present" ? "ПРИСУТСТВОВАЛИ" : "НЕ ПРИСУТСТВОВАЛИ"} (Дата: ${new Date().toLocaleDateString("en-GB")}).`;
      }

      if (!msg) continue;

      try {
        await bot.sendMessage(u.telegramId, msg);
        sentCount++;
      } catch (err) {
        console.error("Telegram message failed for", u.telegramId, err);
      }
    }

    res.json({
      message: "Attendance processed successfully ✅",
      sent: sentCount,
    });
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/attendance
 * View history
 */
router.get("/", async (req, res) => {
  try {
    const history = await getAllAttendance();
    res.json(history);
  } catch (err) {
    console.error("Load attendance history error:", err);
    res.status(500).json({ error: "Failed to load attendance history" });
  }
});

module.exports = router;