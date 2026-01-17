const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const bot = require("../bot");

// ❌ POST — user qo‘shish to‘g‘ridan-to‘g‘ri disabled
router.post("/", async (req, res) => {
  try {
    const { telegramId, username, name, phone, selectedGroupId } = req.body;
    if (!telegramId || !name) return res.status(400).json({ error: "telegramId va name majburiy" });

    const approvedSnap = await db.collection("users").doc(String(telegramId)).get();
    if (approvedSnap.exists) return res.status(200).json({ message: "User already approved" });

    const pendingSnap = await db.collection("users_pending").doc(String(telegramId)).get();
    if (pendingSnap.exists) return res.status(200).json({ message: "User already pending approval" });

    // ✅ FAqat pending users ga qo‘shiladi
    await db.collection("users_pending").doc(String(telegramId)).set({
      telegramId,
      username: username || null,
      firstName: name,
      lastName: req.body.surname || null,
      phone: phone || null,
      selectedGroupId: selectedGroupId || null,
      status: "pending",
      createdAt: new Date()
    });

    // Telegram notify
    try {
      await bot.sendMessage(
        telegramId,
        `Hurmatli ${name}, siz ro'yxatdan o'tdingiz. Admin tasdig‘ini kuting.`
      );
    } catch (err) {
      console.error("Telegram notify failed:", err);
    }

    res.status(201).json({ message: "User added to pending approval" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET — admin ko‘radi, guruh bo‘yicha filter (approved users)
router.get("/", async (req, res) => {
  try {
    const { groupId } = req.query;
    let query = db.collection("users");
    if (groupId) query = query.where("groupId", "==", groupId);

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT — user info yangilash
router.put("/:id", async (req, res) => {
  try {
    await db.collection("users").doc(req.params.id).update(req.body);
    const updated = await db.collection("users").doc(req.params.id).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE — user o‘chirish va Telegram xabar
router.delete("/:id", async (req, res) => {
  try {
    const docRef = db.collection("users").doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: "User not found" });

    const userData = docSnap.data();
    await docRef.delete();

    if (userData.telegramId) {
      try {
        await bot.sendMessage(
          userData.telegramId,
          `Hurmatli ${userData.name}, siz tizimdan o'chirildingiz. Qayta ro'yxatdan o'tish uchun /start ni bosing!`
        );
      } catch (err) {
        console.error("Telegram notify failed:", err);
      }
    }

    res.json({ success: true, message: "User deleted and notification sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user or send notification" });
  }
});

module.exports = router;