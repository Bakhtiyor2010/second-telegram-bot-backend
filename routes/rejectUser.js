const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * DELETE /admin/reject-user/:telegramId
 */
router.delete("/:telegramId", async (req, res) => {
  try {
    await db.collection("users_pending").doc(req.params.telegramId).delete();
    res.json({ message: "User rad etildi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
