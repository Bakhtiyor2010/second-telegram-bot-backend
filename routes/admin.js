const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username, password });
    if (!admin) return res.status(401).json({ error: "Username yoki password xato" });

    // Oddiy token
    const token = "admin-" + admin._id;
    res.json({ token, name: admin.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

module.exports = router;
