const express = require('express');
const router = express.Router();
const adminsCollection = require("../models/Admin");

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username va password kerak' });

    const snapshot = await adminsCollection.where("username", "==", username).get();
    if (snapshot.empty) return res.status(401).json({ error: 'Username yoki password xato' });

    const admin = snapshot.docs[0].data();
    if (admin.password !== password) return res.status(401).json({ error: 'Username yoki password xato' });

    res.json({ message: 'Login muvaffaqiyatli!', role: admin.role });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatoligi' });
  }
});

module.exports = router;
