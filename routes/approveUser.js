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

    // Group name olish
    let groupName = "";
    if (data.selectedGroupId) {
      const groupDoc = await db.collection("groups").doc(data.selectedGroupId).get();
      groupName = groupDoc.exists ? groupDoc.data().name : "";
    }

    // ✅ users collection-ga qo‘shish
    await db.collection("users").doc(telegramId).set({
      telegramId: data.telegramId || "",
      name: data.firstName || "",
      surname: data.lastName || "",
      phone: data.phone || "",
      username: data.username || "",
      groupId: data.selectedGroupId || "",
      groupName,
      status: "active",
      approvedAt: new Date()
    });

    // pending dan o‘chirish
    await pendingRef.delete();

    // Telegram notify
    try {
      await bot.sendMessage(telegramId, `Hurmatli ${data.firstName}, siz ${groupName} guruhiga qo‘shildingiz!`);
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
