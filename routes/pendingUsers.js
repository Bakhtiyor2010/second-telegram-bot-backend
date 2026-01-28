const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

// barcha pending userlar
router.get("/", async (req, res) => {
  try {
      const { limit = 50 } = req.query;
  const snapshot = await db.collection("users_pending").limit(Number(limit)).get();

    const users = snapshot.docs.map(doc => ({
      telegramId: doc.id,
      ...doc.data(),
    }));

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
