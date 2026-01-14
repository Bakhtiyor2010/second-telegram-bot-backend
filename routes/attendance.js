const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const bot = require("../bot");
const User = require("../models/User");

// Attendance qo'shish / update
router.post("/", async (req, res) => {
  try {
    const { userId, groupId, status } = req.body;
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

    // Telegram notification
    const user = await User.findById(userId);
    if(user && user.telegramId) {
      bot.sendMessage(user.telegramId, `Sizning attendance holatingiz: ${status}`);
    }

    res.json({ message: "Attendance saved", attendance });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Attendance history by group
router.get("/history/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const records = await Attendance.find({ groupId })
      .populate("userId", "name surname")
      .sort({ date: -1 });
    res.json(records);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
