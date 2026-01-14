const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt"); // kelajak uchun

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Case-insensitive username tekshirish
    const admin = await Admin.findOne({
      username: { $regex: `^${username}$`, $options: "i" }
    });

    if (!admin) return res.status(401).json({ error: "Username yoki password xato" });

    // Agar plain password ishlatilyapti hozir, shunchaki solishtirish
    if (admin.password !== password) {
      return res.status(401).json({ error: "Username yoki password xato" });
    }

    // Future-proof: agar password hashed bo'lsa, shunday ishlatish mumkin:
    // const match = await bcrypt.compare(password, admin.password);
    // if (!match) return res.status(401).json({ error: "Username yoki password xato" });

    // Token yaratish (oddiy token)
    const token = "admin-" + admin._id;
    res.json({ token, name: admin.name || username, role: admin.role || "moderator" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

module.exports = router;
