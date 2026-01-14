const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const bot = require("../bot");

// POST mark attendance
router.post("/", async (req,res)=>{
  const { userId, groupId, status } = req.body;

  if(!userId || !status) return res.status(400).json({error:"Missing fields"});

  const attendance = new Attendance({ userId, groupId, status });
  await attendance.save();

  // Telegramga xabar yuborish
  const user = await User.findById(userId);
  if(user?.telegramId){
    const text = status === "present" 
      ? "Siz bugun ishtirok etdiniz ✅"
      : "Siz bugun qatnashmadingiz ❌";
    bot.sendMessage(user.telegramId, text).catch(console.error);
  }

  res.json(attendance);
});

// GET user attendance history
router.get("/:userId", async (req,res)=>{
  const history = await Attendance.find({ userId: req.params.userId })
    .sort({date:-1});
  res.json(history);
});

module.exports = router;
