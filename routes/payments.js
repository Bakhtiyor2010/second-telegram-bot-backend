const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

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

    const { paidAt } = await setPaid(userId);

await bot.sendMessage(
  userId,
  `Assalomu alaykum, hurmatli ${name || ""} ${surname || ""}!
To‘lov qabul qilindi. (📅 ${formatDate(paidAt)})`
);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Paid failed" });
  }
});

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0"); // Oy 0 dan boshlanadi
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// GET /api/payments
router.get("/", async (req, res) => {
  try {
    const snap = await db.collection("payments").get();
    const payments = {};

    snap.forEach(doc => {
      const data = doc.data();
      payments[doc.id] = {
        history: data.history || [], // array bo'lishi shart
        latest: data.latest || null
      };
    });

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load payments" });
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
