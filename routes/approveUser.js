const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * POST /admin/approve-user/:telegramId
 */
router.post("/:telegramId", async (req, res) => {
  const { telegramId } = req.params;

  try {
    const pendingRef = db.collection("users_pending").doc(telegramId);
    const pendingSnap = await pendingRef.get();

    if (!pendingSnap.exists) {
      return res.status(404).json({ message: "Pending user topilmadi" });
    }

    const userData = pendingSnap.data();

    // users ga ko‘chirish
    await db.collection("users").doc(telegramId).set({
      ...userData,
      approvedAt: new Date(),
      status: "active",
    });

    // pendingdan o‘chirish
    await pendingRef.delete();

    res.json({ message: "User tasdiqlandi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
