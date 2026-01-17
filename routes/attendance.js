const express = require("express");
const router = express.Router();
const usersCollection = require("../models/User"); // faqat TASDIQLANGAN userlar
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

      // Agar user mavjud bo‘lmasa (pending yoki fake)
      if (!userDoc.exists) {
        continue;
      }

      const u = userDoc.data();

      // Qo‘shimcha xavfsizlik
      if (!u.telegramId || u.status !== "active") {
        continue;
      }

      // 🔹 Default message
      let msg = message;

      if (!msg && status) {
        msg = `Assalomu alaykum, ${u.name || ""} ${u.surname || ""}.
Bugun darsda ${
          status === "present" ? "QATNASHDI" : "QATNASHMADI"
        }.
Sana: ${new Date().toLocaleDateString("en-GB")}`;
      }

      // Telegramga yuborish
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