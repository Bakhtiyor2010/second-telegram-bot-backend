const db = require("../config/db");
const admin = require("firebase-admin");

async function setPaid(userId, name, surname) {
  const today = new Date().toISOString().split("T")[0];
  const paidAt = admin.firestore.Timestamp.now();

  const userRef = db.collection("payments").doc(userId);
  const historyRef = userRef.collection("history").doc(today);

  await userRef.set(
    { currentStatus: "paid", paidAt, unpaidFrom: null, name, surname },
    { merge: true }
  );

  await historyRef.set({ status: "paid", name, surname, date: paidAt, dayKey: today });
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
  const payments = {};

  // NEW
  const newSnap = await db.collectionGroup("history").get();
  newSnap.forEach(doc => {
    const userId = doc.ref.parent.parent.id;
    const h = doc.data();

    if (!payments[userId]) payments[userId] = { history: [] };

    payments[userId].history.push({
      status: h.status,
      name: h.name,
      surname: h.surname,
      date: h.date.toDate(),
      dayKey: h.dayKey,
    });
  });

  // OLD
  const oldSnap = await db.collection("payments").get();
  oldSnap.forEach(doc => {
    const data = doc.data();
    if (!Array.isArray(data.history)) return;

    if (!payments[doc.id]) payments[doc.id] = { history: [] };

    data.history.forEach(h => {
      payments[doc.id].history.push({
        status: h.status,
        name: h.name,
        surname: h.surname,
        date: h.date.toDate(),
        dayKey: h.dayKey,
      });
    });
  });

  return payments;
}

module.exports = { setPaid, setUnpaid, getAllPayments };