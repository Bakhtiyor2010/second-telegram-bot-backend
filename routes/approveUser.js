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

    // ❗ Agar data undefined bo'lsa default qiymat beramiz
    const firstName = data.firstName || "";
    const lastName = data.lastName || "";
    const phone = data.phone || "";
    const username = data.username || "";
    const selectedGroupId = data.selectedGroupId || "";

    // Group name olish
    let groupName = "";
    if (selectedGroupId) {
      const groupDoc = await db.collection("groups").doc(selectedGroupId).get();
      groupName = groupDoc.exists ? groupDoc.data().name : "";
    }

    // ✅ users collection-ga to‘g‘ri saqlash
    await db.collection("users").doc(String(telegramId)).set({
      telegramId: Number(telegramId),
      name: firstName,
      surname: lastName,
      phone,
      username,
      groupId: selectedGroupId,
      groupName,
      status: "active",
      approvedAt: admin.firestore.Timestamp.now()
    });

    // pending dan o‘chirish
    await pendingRef.delete();

    // Telegram notify
    try {
      await bot.sendMessage(
        telegramId,
        `Hurmatli ${firstName} ${lastName}, siz "${groupName || "guruh"}" guruhiga qo‘shildingiz!`
      );
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
