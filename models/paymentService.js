const admin = require("firebase-admin");
const db = admin.firestore();

async function setPaid(userId) {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  await db.collection("payments").doc(userId).set({
    status: "paid",
    startDate,
    endDate,
    createdAt: new Date(),
  });

  return { startDate, endDate };
}

async function setUnpaid(userId) {
  await db.collection("payments").doc(userId).set({
    status: "unpaid",
    startDate: null,
    endDate: null,
    createdAt: new Date(),
  });
}

async function deletePayment(userId) {
  await db.collection("payments").doc(userId).delete();
}

async function getAllPayments() {
  const snap = await db.collection("payments").get();
  const payments = {};

  snap.forEach(doc => {
    payments[doc.id] = doc.data();
  });

  return payments;
}

module.exports = {
  setPaid,
  setUnpaid,
  deletePayment,
  getAllPayments,
};