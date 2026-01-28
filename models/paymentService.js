const db = require("../config/db");
const admin = require("firebase-admin");

async function setPaid(userId, name, surname) {
  const today = new Date().toISOString().split("T")[0];
  const paidAtTimestamp = admin.firestore.Timestamp.now();

  const userRef = db.collection("payments").doc(userId);
  const historyRef = userRef.collection("history").doc(today);

  await userRef.set(
    { currentStatus: "paid", paidAt: paidAtTimestamp, unpaidFrom: null, name, surname },
    { merge: true }
  );

  await historyRef.set({ status: "paid", name, surname, date: paidAtTimestamp, dayKey: today });

  // ✅ Return paidAt as a Date
  return { paidAt: paidAtTimestamp.toDate() };
}

// 🔹 So'ngi to‘lovni o‘chirish
// Mark as Unpaid
async function setUnpaid(userId, name = "-", surname = "-") {
  if (!userId) throw new Error("userId required");

  const today = new Date().toISOString().split("T")[0];
  const unpaidAtTimestamp = admin.firestore.Timestamp.now();

  const userRef = db.collection("payments").doc(userId);
  const historyRef = userRef.collection("history").doc(today);

  // Update current status in main doc
  await userRef.set(
    {
      currentStatus: "unpaid",
      unpaidFrom: unpaidAtTimestamp,
      paidAt: null,
      name,
      surname
    },
    { merge: true }
  );

  // Add unpaid record to history subcollection (consistent with setPaid)
  await historyRef.set({
    status: "unpaid",
    name,
    surname,
    date: unpaidAtTimestamp,
    dayKey: today
  });

  return { unpaidAt: unpaidAtTimestamp.toDate() };
}

// 🔹 Barcha paymentlarni olish
async function getAllPayments() {
  const payments = {};

  // NEW: collectionGroup "history"
  const newSnap = await db.collectionGroup("history").get();
  newSnap.forEach(doc => {
    const parentDoc = doc.ref.parent.parent;
    if (!parentDoc) return; // skip if no parent

    const userId = parentDoc.id;
    const h = doc.data();

    if (!payments[userId]) payments[userId] = { history: [] };

    // check h.date
    let dateObj = null;
    if (h.date && h.date.toDate) dateObj = h.date.toDate();

    payments[userId].history.push({
      status: h.status || "unknown",
      name: h.name || "-",
      surname: h.surname || "-",
      date: dateObj,
      dayKey: h.dayKey || null,
    });
  });

  // OLD: payments collection
  const oldSnap = await db.collection("payments").get();
  oldSnap.forEach(doc => {
    const data = doc.data();
    if (!Array.isArray(data.history)) return;

    if (!payments[doc.id]) payments[doc.id] = { history: [] };

    data.history.forEach(h => {
      let dateObj = null;
      if (h.date && h.date.toDate) dateObj = h.date.toDate();

      payments[doc.id].history.push({
        status: h.status || "unknown",
        name: h.name || "-",
        surname: h.surname || "-",
        date: dateObj,
        dayKey: h.dayKey || null,
      });
    });
  });

  return payments;
}

module.exports = { setPaid, setUnpaid, getAllPayments };