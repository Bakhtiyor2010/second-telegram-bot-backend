const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

// Login endpoint
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username, password });
    if (!admin) return res.status(401).json({ error: "Username yoki password xato" });

    // Oddiy token (misol uchun)
    const token = "admin-" + admin._id;

    res.json({ token, name: admin.name, role: admin.role || "moderator" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ME endpoint
router.get("/me", async (req, res) => {
  const token = req.header("admin-id"); // frontend header orqali yuboradi
  if (!token) return res.status(401).json({ error: "Token missing" });

  const adminId = token.split("-")[1];
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    res.json({ name: admin.name, role: admin.role || "moderator" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

module.exports = router;