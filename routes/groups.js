const express = require("express");
const router = express.Router();
const groupsCollection = require("../models/Group");
const usersCollection = require("../models/User");
const bot = require("../bot");

// GET all groups
router.get("/", async (req, res) => {
  try {
    const snapshot = await groupsCollection.get();
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

    const newGroupRef = groupsCollection.doc();
    await newGroupRef.set({ name });
    res.json({ id: newGroupRef.id, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT edit group
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    await groupsCollection.doc(req.params.id).update({ name });

    const usersSnapshot = await usersCollection.where("groupId", "==", req.params.id).get();
    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      if (user.telegramId) {
        await bot.sendMessage(user.telegramId, `ℹ️ Sizning guruh nomingiz "${name}" ga o'zgartirildi.`);
      }
    }

    res.json({ id: req.params.id, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE group
router.delete("/:id", async (req, res) => {
  try {
    const groupDoc = await groupsCollection.doc(req.params.id).get();
    if (!groupDoc.exists) return res.status(404).json({ error: "Group not found" });

    const groupName = groupDoc.data().name;
    const usersSnapshot = await usersCollection.where("groupId", "==", req.params.id).get();

    await groupsCollection.doc(req.params.id).delete();

    for (const doc of usersSnapshot.docs) {
      await usersCollection.doc(doc.id).delete();
      if (doc.data().telegramId) {
        await bot.sendMessage(
          doc.data().telegramId,
          `⚠️ Sizning guruhingiz "${groupName}" o'chirildi. Sizning ma'lumotlaringiz ham o'chirildi.`
        );
      }
    }

    res.json({ message: "Group and its users deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
