const admin = require("firebase-admin");
const db = admin.firestore();

// 🔹 Payment qo‘shish
async function setPaid(userId, name, surname) {
  const paidAt = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection("payments").doc(userId);
  const doc = await docRef.get();

  if (doc.exists) {
    await docRef.update({
      paidAt,
      history: admin.firestore.FieldValue.arrayUnion({
        name,
        surname,
        paidAt,
      }),
    });
  } else {
    await docRef.set({
      paidAt,
      history: [{ name, surname, paidAt }],
    });
  }

  return { paidAt: new Date() };
}

// 🔹 To‘lovni o‘chirish
async function setUnpaid(userId) {
  await db.collection("payments").doc(userId).delete();
}

async function deletePayment(userId) {
  await db.collection("payments").doc(userId).delete();
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
            name: h.name,
            surname: h.surname,
            paidAt: h.paidAt ? h.paidAt.toDate() : null,
          }))
        : [],
    };
  });

  return payments;
}

module.exports = {
  setPaid,
  setUnpaid,
  deletePayment,
  getAllPayments,
};