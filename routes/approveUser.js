const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const bot = require("../bot");

router.post("/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const pendingRef = db.collection("users_pending").doc(telegramId);
    const snap = await pendingRef.get();

    if (!snap.exists) return res.status(404).json({ message: "Pending user not found" });

    const data = snap.data();

    await db.collection("users").doc(telegramId).set({
      telegramId: data.telegramId,
      name: data.firstName,
      surname: data.lastName,
      phone: data.phone,
      groupId: data.selectedGroupId,
      status: "active",
      approvedAt: new Date(),
    });

    await pendingRef.delete();

    // Telegram notify
    try {
      await bot.sendMessage(telegramId, `Hurmatli ${data.firstName}, siz guruhga qo‘shildingiz!`);
    } catch (err) {
      console.error("Telegram notify failed:", err);
    }

    return res.json({ message: "User approved successfully" });

  } catch (err) {
    console.error("Approve error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
