const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const bot = require("../bot");

router.post("/:telegramId", async (req, res) => {
  const { telegramId } = req.params;

  try {
    const pendingRef = db.collection("users_pending").doc(telegramId);
    const snap = await pendingRef.get();

    if (!snap.exists) {
      return res.status(404).json({ message: "Pending user not found" });
    }

    const data = snap.data();

    // 🔹 Firestore uchun undefined qiymatlarni tekshirish
    const userData = {
      telegramId: data.telegramId || "",
      name: data.firstName || "—",
      surname: data.lastName || "—",
      phone: data.phone || "",
      groupId: data.selectedGroupId || "",
      status: "active",
      approvedAt: new Date(),
    };

    // ✅ users ga qo‘shish, undefined qiymatlar ignore qilinadi
    await db.collection("users").doc(telegramId).set(userData, { ignoreUndefinedProperties: true });

    // 🔹 Pending userni o‘chirish
    await pendingRef.delete();

    // 🔹 Telegram notify
    try {
      await bot.sendMessage(
        telegramId,
        `Hurmatli ${userData.name}, siz guruhga qo‘shildingiz!`
      );
    } catch (err) {
      console.error("Telegram notify failed:", err);
    }

    res.json({ message: "User approved successfully", user: userData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;