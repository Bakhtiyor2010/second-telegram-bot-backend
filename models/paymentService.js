const admin = require("firebase-admin");
const db = admin.firestore();

async function setPaid(userId) {
  const paidAtServer = admin.firestore.FieldValue.serverTimestamp();
  const paidAtLocal = new Date();

  const endDate = new Date(paidAtLocal);
  endDate.setMonth(endDate.getMonth() + 1);

  // 🔹 1. PAYMENT HISTORY (YANGI RECORD, OVERWRITE YO‘Q)
  await db.collection("payment_history").add({
    userId: String(userId),
    status: "paid",
    paidAt: admin.firestore.Timestamp.fromDate(paidAtLocal),
    endDate: admin.firestore.Timestamp.fromDate(endDate),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 🔹 2. HOZIRGI PAYMENT (OLD LOGIKA SAQLANDI)
  await db.collection("payments").doc(String(userId)).set({
    paidAt: paidAtServer,
    createdAt: paidAtServer,
    endDate: admin.firestore.Timestamp.fromDate(endDate),
  });

  return { paidAt: paidAtLocal };
}

async function setUnpaid(userId) {
  // ❗ historyga tegmaymiz
  await db.collection("payments").doc(String(userId)).delete();
}

async function deletePayment(userId) {
  // ❗ historyga tegmaymiz
  await db.collection("payments").doc(String(userId)).delete();
}

async function getAllPayments() {
  const snap = await db.collection("payments").get();
  const payments = {};

  snap.forEach(doc => {
    const data = doc.data();
    payments[doc.id] = {
      paidAt: data.paidAt ? data.paidAt.toDate() : null,
      endDate: data.endDate ? data.endDate.toDate() : null,
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