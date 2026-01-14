const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username, password });
    if (!admin) {
      return res.status(401).json({ error: "Username yoki password xato" });
    }

    // oddiy admin-id token
    res.json({
      adminId: admin._id,
      name: admin.name,
      role: admin.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// ME (ROLE OLISH UCHUN)
router.get("/me", (req, res) => {
  if (!req.admin) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({
    id: req.admin._id,
    name: req.admin.name,
    role: req.admin.role
  });
});

module.exports = router;