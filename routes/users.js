const express = require("express");
const router = express.Router();
const usersCollection = require("../models/User");
const bot = require("../bot");

// POST — user qo'shish
router.post("/", async (req, res) => {
  try {
    const { telegramId, username, name, phone, groupId } = req.body;
    if (!telegramId || !name) return res.status(400).json({ error: "Missing fields" });

    const snapshot = await usersCollection.where("telegramId", "==", telegramId).get();
    if (!snapshot.empty) return res.status(200).json({ message: "User already exists" });

    await usersCollection.doc(telegramId).set({
      telegramId,
      username,
      name,
      phone,
      groupId,
      role: "moderator",
      createdAt: new Date()
    });

    res.status(201).json({ telegramId, username, name, phone, groupId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET — admin ko‘radi, guruh bo‘yicha filter
router.get("/", async (req, res) => {
  try {
    const { groupId } = req.query;
    let query = usersCollection;
    if (groupId) query = query.where("groupId", "==", groupId);

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT — admin tahriri
router.put("/:id", async (req, res) => {
  try {
    await usersCollection.doc(req.params.id).update(req.body);
    const updated = await usersCollection.doc(req.params.id).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE — admin o‘chiradi + telegram xabar
router.delete("/:id", async (req, res) => {
  try {
    const userDoc = await usersCollection.doc(req.params.id).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

    const telegramId = userDoc.data().telegramId;
    await usersCollection.doc(req.params.id).delete();

    if (telegramId) {
      try { 
        await bot.sendMessage(telegramId, "Salom! Sizning ma’lumotlaringiz admin tomonidan o‘chirildi."); 
      } catch (err) { 
        console.error("Telegram xabar yuborishda xato:", err); 
      }
    }

    res.json({ message: "User was deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
