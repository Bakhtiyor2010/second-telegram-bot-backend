const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const bot = require("../bot");

// Attendance qo'shish / update va Telegram xabar yuborish
router.post("/", async (req, res) => {
  try {
    const { userId, groupId, status, message } = req.body;

    // agar faqat message yuborilgan bo‘lsa
    if (!status && message) {
      if (!userId || userId.length === 0) return res.status(400).json({ error: "No users selected" });

      const users = await User.find({ _id: { $in: Array.isArray(userId) ? userId : [userId] } });
      for (const u of users) {
        if (u.telegramId) bot.sendMessage(u.telegramId, message).catch(console.error);
      }
      return res.json({ message: "Messages sent ✅" });
    }

    // attendance saqlash
    if (!userId || !groupId || !status) return res.status(400).json({ error: "Missing fields" });

    const today = new Date();
    today.setHours(0,0,0,0);

    let attendance = await Attendance.findOne({ userId, groupId, date: { $gte: today } });
    if(attendance) {
      attendance.status = status;
      await attendance.save();
    } else {
      attendance = new Attendance({ userId, groupId, status });
      await attendance.save();
    }

    const user = await User.findById(userId);
    if(user && user.telegramId) {
      const msg = `Siz bugun ${status === "present" ? "KELDINGIZ" : "KELMADINGIZ"} (${new Date().toLocaleDateString()})`;
      bot.sendMessage(user.telegramId, msg).catch(console.error);
    }

    res.json({ message: "Attendance saved ✅", attendance });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
