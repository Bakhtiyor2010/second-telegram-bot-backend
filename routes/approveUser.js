const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

router.post("/:telegramId", async (req, res) => {
  const { telegramId } = req.params;

  const pendingRef = db.collection("users_pending").doc(telegramId);
  const snap = await pendingRef.get();

  if (!snap.exists) {
    return res.status(404).json({ message: "Pending user not found" });
  }

  const data = snap.data();

  // ✅ Faqat shu yerda users ga qo‘shiladi
  await db.collection("users").doc(telegramId).set({
    telegramId: data.telegramId,
    name: data.firstName,
    surname: data.lastName,
    phone: data.phone,
    username: data.username || "",
    groupId: data.selectedGroupId,
    status: "active",
    approvedAt: new Date(),
  });

  await pendingRef.delete();

  res.json({ message: "User approved successfully" });
});

module.exports = router;
