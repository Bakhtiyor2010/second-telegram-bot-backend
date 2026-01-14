const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bot = require("../bot");

// POST — user qo'shish (botdan keladi)
router.post("/", async (req, res) => {
  try {
    const { telegramId, username, name, phone } = req.body;
    if (!telegramId || !name) return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ telegramId });
    if (exists) return res.status(200).json({ message: "User already exists" });

    const user = new User({ telegramId, username, name, phone });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET — admin ko‘radi
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT — admin tahriri
router.put("/:id", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE — admin o‘chiradi + telegram xabar
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({ error: "User not found" });

    const telegramId = user.telegramId;
    await User.findByIdAndDelete(req.params.id);

    if(telegramId) {
      try { await bot.sendMessage(telegramId, "Salom! Sizning ma’lumotlaringiz admin tomonidan o‘chirildi."); }
      catch(err){ console.error("Telegram xabar yuborishda xato:", err); }
    }

    res.json({ message: "User was deleted successfully" });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
