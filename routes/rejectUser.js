const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

router.delete("/:telegramId", async (req, res) => {
  try {
    await db.collection("users_pending").doc(req.params.telegramId).delete();
    res.json({ message: "User rejected successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;