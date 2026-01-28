const express = require("express");
const router = express.Router();
const {
  addAttendance,
  getAllAttendance,
} = require("../models/attendanceService");
const usersCollection = require("../models/User");
const bot = require("../bot");

// POST /api/attendance — mark attendance
router.post("/", async (req, res) => {
  try {
    const { userId, status, message, adminUsername } = req.body;
    if (!userId) return res.status(400).json({ error: "No users selected" });

    const ids = Array.isArray(userId) ? userId : [userId];
    let sentCount = 0;

    // ✅ Fetch all user docs in parallel to reduce reads
    const userDocs = await Promise.all(
      ids.map((id) => usersCollection.doc(String(id)).get()),
    );

    for (let i = 0; i < userDocs.length; i++) {
      const doc = userDocs[i];
      if (!doc.exists) continue;

      const u = doc.data();
      if (u.status !== "active" || !u.telegramId) continue;

      // Attendance qo‘shish
      if (status) {
        await addAttendance(
          u.telegramId,
          status,
          u.name || "",
          u.surname || "",
          u.phone || "",
          u.groupName || "",
          adminUsername || "Admin",
        );
      }

      // Telegram xabar
      let msg = message;
      if (!msg && status) {
        const today = new Date();
        const dateStr = today.toLocaleDateString("en-GB");
        msg = `Assalomu alaykum, ${u.name || ""} ${u.surname || ""} bugun darsda ${
          status === "present" ? "QATNASHDI" : "QATNASHMADI"
        } (Sana: ${dateStr}).\n\nЗдравствуйте, ${u.name || ""} ${u.surname || ""}, сегодня на занятии вы ${
          status === "present" ? "ПРИСУТСТВОВАЛИ" : "НЕ ПРИСУТСТВОВАЛИ"
        } (Дата: ${dateStr}).`;
      }

      try {
        await bot.sendMessage(u.telegramId, msg);
        sentCount++;
      } catch (err) {
        console.error("Telegram message failed:", err);
      }
    }

    res.json({ message: "Attendance processed", sent: sentCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/attendance — get all attendance
router.get("/", async (req, res) => {
  try {
    const history = await getAllAttendance();
    res.json(history); // adminUsername shu yerda ko‘rinadi
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load attendance" });
  }
});

module.exports = router;