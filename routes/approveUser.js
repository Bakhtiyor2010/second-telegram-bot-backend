const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const bot = require("../bot");

router.post("/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;

    // 1️⃣ Pending user hujjatini olish
    const pendingRef = db.collection("users_pending").doc(telegramId);
    const snap = await pendingRef.get();
    if (!snap.exists) return res.status(404).json({ message: "Pending user not found" });

    const data = snap.data();

    // 2️⃣ groupId va groupName ni pending_users dan olish
    const groupId = data.groupId;
const groupName = data.groupName;

    if (!groupId || !groupName) {
      return res.status(400).json({ message: "Pending user da groupId yoki groupName mavjud emas" });
    }

    // 3️⃣ users collection ga yozish
    await db.collection("users").doc(telegramId).set({
      telegramId: data.telegramId,
      name: data.firstName || "",
      surname: data.lastName || "",
      phone: data.phone || "",
      username: data.username || "",
      groupId,
      groupName,
      status: "active",
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4️⃣ Pending dan o‘chirish
    await pendingRef.delete();

    // 5️⃣ Telegram notify
    try {
      await bot.sendMessage(
        telegramId,
        `Hurmatli ${data.firstName}, siz ${groupName} guruhiga qo‘shildingiz!`
      );
    } catch (err) {
      console.error("Telegram notify failed:", err);
    }

    res.json({ message: "User approved successfully", groupName });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;
