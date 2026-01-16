const express = require("express");
const router = express.Router();

const {
  setPaid,
  setUnpaid,
  deletePayment,
  getAllPayments,
} = require("../models/paymentService");

const bot = require("../bot");

// 🔹 PAID
router.post("/paid", async (req, res) => {
  try {
    const { userId, name, surname } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const { startDate, endDate } = await setPaid(userId);

    await bot.sendMessage(
      userId,
      `Salom, hurmatli ${name || ""} ${surname || ""}!
To‘lov qabul qilindi.
📅 ${startDate.toLocaleDateString()} dan ${endDate.toLocaleDateString()} gacha amal qiladi.`
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Paid failed" });
  }
});

// 🔹 UNPAID
router.post("/unpaid", async (req, res) => {
  try {
    const { userId, name, surname } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    await setUnpaid(userId);

    await bot.sendMessage(
      userId,
      `Hurmatli ${name || ""} ${surname || ""}!
Iltimos, to‘lovni tezroq amalga oshiring.`
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unpaid failed" });
  }
});

// 🔹 DELETE payment
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await deletePayment(userId);

    await bot.sendMessage(
      userId,
      `Hurmatli foydalanuvchi!
To‘lov tarixingiz o‘chirildi.`
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// 🔹 GET all payments
router.get("/", async (req, res) => {
  try {
    const payments = await getAllPayments();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: "Failed to load payments" });
  }
});

module.exports = router;
