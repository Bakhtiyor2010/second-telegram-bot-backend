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

    // 🔹 Group name olish
    let groupName = "";
    if (data.selectedGroupId) {
      const groupSnap = await db.collection("groups").doc(data.selectedGroupId).get();
      groupName = groupSnap.exists ? groupSnap.data().name : "";
    }

    // 🔹 Users collection-ga to‘g‘ri saqlash
    await db.collection("users").doc(telegramId).set({
      telegramId: data.telegramId || "",
      name: data.firstName || "",
      surname: data.lastName || "",
      phone: data.phone || "",
      username: data.username || "",
      groupId: data.selectedGroupId || "",
      groupName: groupName || "",
      status: "active",
      approvedAt: new Date(),
    });

    // 🔹 Pending userni o‘chirish
    await pendingRef.delete();

    // 🔹 Telegram notify
    try {
      await bot.sendMessage(
        telegramId,
        `Hurmatli ${data.firstName || "Foydalanuvchi"}, siz guruhga qo‘shildingiz!`
      );
    } catch (err) {
      console.error("Telegram notify failed:", err);
    }

    // 🔹 JSON response (frontend uchun)
    res.json({
      message: "User approved successfully",
      user: {
        telegramId: data.telegramId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        groupId: data.selectedGroupId,
        groupName: groupName,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;