const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const bot = require("../bot");

router.post("/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const pendingRef = db.collection("users_pending").doc(String(telegramId));
    const snap = await pendingRef.get();

    if (!snap.exists) return res.status(404).json({ message: "Pending user not found" });

    const data = snap.data();

    // ✅ Boshqa nomlar bilan chaqirishga ehtiyot bo‘ling
    const firstName = data.firstName || "";
    const lastName = data.lastName || "";
    const phone = data.phone || "";
    const username = data.username || "";
    const groupId = data.selectedGroupId || "";

    // 🔹 Group name olish
    let groupName = "";
    if (groupId) {
      const groupDoc = await db.collection("groups").doc(groupId).get();
      groupName = groupDoc.exists ? groupDoc.data().name : "";
    }

    // ✅ users collection-ga to‘g‘ri qo‘shish
    await db.collection("users").doc(String(telegramId)).set({
      telegramId,
      name: firstName,
      surname: lastName,
      phone,
      username,
      groupId,
      groupName,
      status: "active",
      approvedAt: new Date()
    });

    // pending dan o‘chirish
    await pendingRef.delete();

    // Telegram notify
    try {
      await bot.sendMessage(telegramId, `Hurmatli ${firstName} ${lastName}, siz ${groupName} guruhiga qo‘shildingiz!`);
    } catch (err) {
      console.error("Telegram notify failed:", err);
    }

    res.json({ message: "User approved successfully", groupName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
