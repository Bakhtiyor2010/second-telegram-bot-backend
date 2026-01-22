const admin = require("firebase-admin");
const db = admin.firestore();

// 🔹 Payment qo‘shish
async function setPaid(userId, name, surname) {
  if (!userId || !name || !surname)
    throw new Error("userId, name and surname are required");

  const paidAt = admin.firestore.Timestamp.now();
  const docRef = db.collection("payments").doc(userId);
  const doc = await docRef.get();
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`; // YYYY-M-D

  const record = {
    status: "paid",
    name,
    surname,
    date: paidAt,
    dayKey,
  };

  if (doc.exists) {
    const history = doc.data().history || [];
    const existsIndex = history.findIndex((h) => h.dayKey === dayKey);

    if (existsIndex >= 0) {
      // agar bugungi sana recordi bor bo‘lsa, uni yangilaymiz
      history[existsIndex] = record;
      await docRef.update({
        history,
        currentStatus: "paid",
        paidAt,
        unpaidFrom: null,
      });
    } else {
      // yo‘q bo‘lsa arrayUnion bilan qo‘shamiz
      await docRef.update({
        history: admin.firestore.FieldValue.arrayUnion(record),
        currentStatus: "paid",
        paidAt,
        unpaidFrom: null,
      });
    }
  } else {
    await docRef.set({
      currentStatus: "paid",
      paidAt,
      unpaidFrom: null,
      history: [record],
    });
  }

  return { paidAt: paidAt.toDate() };
}

// 🔹 So'ngi to‘lovni o‘chirish
async function setUnpaid(userId) {
  if (!userId) throw new Error("userId required");

  const docRef = db.collection("payments").doc(userId);
  const doc = await docRef.get();
  const unpaidAt = admin.firestore.Timestamp.now();
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  const record = {
    status: "unpaid",
    date: unpaidAt,
    dayKey,
  };

  if (doc.exists) {
    const history = doc.data().history || [];
    const existsIndex = history.findIndex((h) => h.dayKey === dayKey);

    if (existsIndex >= 0) {
      history[existsIndex] = record;
      await docRef.update({
        history,
        currentStatus: "unpaid",
        paidAt: null,
        unpaidFrom: unpaidAt,
      });
    } else {
      await docRef.update({
        history: admin.firestore.FieldValue.arrayUnion(record),
        currentStatus: "unpaid",
        paidAt: null,
        unpaidFrom: unpaidAt,
      });
    }
  } else {
    await docRef.set({
      currentStatus: "unpaid",
      paidAt: null,
      unpaidFrom: unpaidAt,
      history: [record],
    });
  }

  return { unpaidAt: unpaidAt.toDate() };
}

// 🔹 Barcha paymentlarni olish
async function getAllPayments() {
  const snap = await db.collection("payments").get();
  const payments = {};

  snap.forEach((doc) => {
    const data = doc.data();
    payments[doc.id] = {
      paidAt: data.paidAt ? data.paidAt.toDate() : null,
      history: data.history
        ? data.history.map((h) => ({
            status: h.status,
            name: h.name || null,
            surname: h.surname || null,
            date: h.date ? h.date.toDate() : null,
          }))
        : [],
    };
  });

  return payments;
}

module.exports = { setPaid, setUnpaid, getAllPayments };