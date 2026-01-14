const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const User = require("../models/User");
const bot = require("../bot");

// GET all groups
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create group
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const group = new Group({ name });
    await group.save();
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT edit group (nomi o'zgartirilsa botga xabar)
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const group = await Group.findByIdAndUpdate(req.params.id, { name }, { new: true });

    if (group) {
      const usersInGroup = await User.find({ groupId: group._id });
      for (const user of usersInGroup) {
        if (user.telegramId) {
          await bot.sendMessage(user.telegramId, `ℹ️ Sizning guruh nomingiz "${name}" ga o'zgartirildi.`);
        }
      }
    }

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE group (userlar bilan birga + bot xabarlari)
router.delete("/:id", async (req, res) => {
  try {
    const groupId = req.params.id;

    const usersInGroup = await User.find({ groupId });

    await Group.findByIdAndDelete(groupId);

    for (const user of usersInGroup) {
      await User.findByIdAndDelete(user._id);
      if (user.telegramId) {
        await bot.sendMessage(user.telegramId, `⚠️ Sizning guruhingiz "${user.groupId}" o'chirildi. Sizning ma'lumotlaringiz ham o'chirildi.`);
      }
    }

    res.json({ message: "Group and its users deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;