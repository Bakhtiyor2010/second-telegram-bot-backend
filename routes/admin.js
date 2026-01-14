const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Username va password bo‘lishi kerak
    if (!username || !password) {
      return res.status(400).json({ error: 'Username va password kerak' });
    }

    // MongoDB da username tekshirish
    const admin = await Admin.findOne({ username: username.trim() });
    if (!admin) {
      return res.status(401).json({ error: 'Username yoki password xato' });
    }

    // Password tekshirish (plain text)
    if (admin.password.trim() !== password.trim()) {
      return res.status(401).json({ error: 'Username yoki password xato' });
    }

    // Agar hammasi to‘g‘ri bo‘lsa
    res.json({
  message: 'Login muvaffaqiyatli!',
  admin: {
    id: admin._id,
    username: admin.username,
    role: admin.role   // "superadmin" yoki "moderator"
  }
});


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatoligi' });
  }
});

module.exports = router;
