const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // yoki bcryptjs, agar bcrypt ishlamasa
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); // Admin model

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username va password kerak' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: 'Username yoki password xato' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Username yoki password xato' });
    }

    // Token yaratish
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.json({ token, role: admin.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatoligi' });
  }
});

module.exports = router;
