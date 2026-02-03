const express = require("express");
const router = express.Router();
const {
  setPaid,
  setUnpaid,
  deletePayment,
  getAllPayments,
} = require("../models/paymentService");
const bot = require("../bot");

// Helper: format date
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// --------------------- POST /paid ---------------------
router.post("/paid", async (req, res) => {
  try {
    const { userId, name, surname, month, year } = req.body;
    if (!userId || !name || !surname || !month || !year)
      return res.status(400).json({ error: "userId, name, surname, month, and year required" });

    const { paidAt, monthKey } = await setPaid(userId, name, surname, month, year);

    if (bot) {
      const monthNameUz = month;
      const monthNameRu = month;
      const dateStr = formatDate(paidAt);

      await bot.sendMessage(
        userId,
        `Assalomu alaykum, hurmatli ${name} ${surname}!\n${monthNameUz} oyi kurs to‘lovi qabul qilindi (📅 ${dateStr})\n\n` +
        `Здравствуйте, уважаемый(ая) ${name} ${surname}!\nОплата курса за ${monthNameRu} принята (📅 ${dateStr})`
      );
    }

    res.json({ success: true, paidAt, monthKey });
  } catch (err) {
    console.error("PAID ERROR:", err);
    res.status(500).json({ error: err.message || "Paid failed" });
  }
});

router.post("/unpaid", async (req, res) => {
  try {
    const { userId, name, surname, month, year } = req.body;
    if (!userId || !month || !year)
      return res.status(400).json({ error: "userId, month, and year required" });

    const { unpaidAt, monthKey } = await setUnpaid(userId, name, surname, month, year);

    if (bot) {
      await bot.sendMessage(
        userId,
        `Hurmatli ${name || ""} ${surname || ""}! Iltimos, ${month} oyining to‘lovini tezroq amalga oshiring.\n\n` +
        `Уважаемый(ая) ${name || ""} ${surname || ""}! Пожалуйста, произведите оплату за ${month} как можно скорее.`
      );
    }

    res.json({ success: true, unpaidAt, monthKey });
  } catch (err) {
    console.error("UNPAID ERROR:", err);
    res.status(500).json({ error: err.message || "Unpaid failed" });
  }
});

// --------------------- POST /unpaid ---------------------
router.post("/unpaid", async (req, res) => {
  try {
    const { userId, name, surname } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const result = await setUnpaid(userId, name, surname);

    if (bot) {
      await bot.sendMessage(
        userId,
        `Hurmatli ${name || ""} ${surname || ""}! Iltimos, to‘lovni tezroq amalga oshiring.\n\nУважаемый(ая) ${name || ""} ${surname || ""}! Пожалуйста, произведите оплату как можно скорее.`
      );
    }

    // ✅ Send success flag so frontend doesn't show error
    res.json({
      success: true,
      unpaidAt: result.unpaidAt
    });
  } catch (err) {
    console.error("UNPAID ERROR:", err);
    res.status(500).json({ error: err.message || "Unpaid failed" });
  }
});

// --------------------- DELETE /:userId ---------------------
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, surname } = req.body;

    await deletePayment(userId);

    if (bot) {
      await bot.sendMessage(
        userId,
        `Hurmatli ${name || ""} ${surname || ""}!\nTo‘lov tarixingiz o‘chirildi.\n\nУважаемый(ая) ${name || ""} ${surname || ""}!\nВаша история платежей была удалена.`,
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message || "Delete failed" });
  }
});

// --------------------- GET / ---------------------
router.get("/", async (req, res) => {
  try {
    const payments = await getAllPayments();
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load payments" });
  }
});

module.exports = router;