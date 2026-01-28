const express = require("express");
const router = express.Router();
const adminsCollection = require("../models/Admin");

// POST /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username va password majburiy" });
    }

    const snapshot = await adminsCollection
      .where("username", "==", username)
      .limit(1)
      .get();
    if (snapshot.empty)
      return res
        .status(401)
        .json({ error: "Username yoki password noto‘g‘ri" });

    const adminDoc = snapshot.docs[0];
    const adminData = adminDoc.data();

    if (adminData.password !== password) {
      return res
        .status(401)
        .json({ error: "Username yoki password noto‘g‘ri" });
    }

    res.json({
      id: adminDoc.id,
      username: adminData.username,
      role: adminData.role || "admin",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;