const admin = require("firebase-admin");
const db = admin.firestore();

// 🔹 Payment qo‘shish
async function setPaid(userId, name, surname) {
  if (!userId || !name || !surname)
    throw new Error("userId, name and surname are required");

  const paidAt = admin.firestore.Timestamp.now();
  const docRef = db.collection("payments").doc(userId);
  const doc = await docRef.get();

  const record = {
    status: "paid",
    name,
    surname,
    date: paidAt,
  };

  if (doc.exists) {
    await docRef.update({
      currentStatus: "paid",
      paidAt,
      unpaidFrom: null,
      history: admin.firestore.FieldValue.arrayUnion(record),
    });
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

  const record = {
    status: "unpaid",
    date: unpaidAt,
  };

  if (doc.exists) {
    await docRef.update({
      currentStatus: "unpaid",
      unpaidFrom: unpaidAt,
      paidAt: null,
      history: admin.firestore.FieldValue.arrayUnion(record),
    });
  } else {
    // Agar hech qachon paid bo‘lmagan bo‘lsa ham
    await docRef.set({
      currentStatus: "unpaid",
      unpaidFrom: unpaidAt,
      paidAt: null,
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