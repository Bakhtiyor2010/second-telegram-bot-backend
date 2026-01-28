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

// Helper: month names
const monthsUz = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

const monthsRu = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

// --------------------- POST /paid ---------------------
router.post("/paid", async (req, res) => {
  try {
    const { userId, name, surname } = req.body;
    if (!userId || !name || !surname)
      return res
        .status(400)
        .json({ error: "userId, name and surname required" });

    const { paidAt } = await setPaid(userId, name, surname);

    if (bot) {
      const monthName = monthsUz[new Date(paidAt).getMonth()];
      const russianMonthName = monthsRu[new Date(paidAt).getMonth()];
      const dateStr = formatDate(paidAt);

      await bot.sendMessage(
        userId,
        `Assalomu alaykum, hurmatli ${name} ${surname}!\n${monthName} oyi kurs to‘lovi qabul qilindi (📅 ${dateStr})\n\nЗдравствуйте, уважаемый(ая) ${name} ${surname}!\nОплата курса за ${russianMonthName} принята (📅 ${dateStr})`,
      );
    }

    res.json({ success: true, paidAt });
  } catch (err) {
    console.error("PAID ERROR:", err);
    res.status(500).json({ error: err.message || "Paid failed" });
  }
});

// --------------------- POST /unpaid ---------------------
router.post("/unpaid", async (req, res) => {
  try {
    const { userId, name, surname } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    await setUnpaid(userId);

    if (bot) {
      await bot.sendMessage(
        userId,
        `Hurmatli ${name || ""} ${surname || ""}!\nIltimos, to‘lovni tezroq amalga oshiring.\n\nУважаемый(ая) ${name || ""} ${surname || ""}!\nПожалуйста, произведите оплату как можно скорее.`,
      );
    }

    res.json({ success: true });
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