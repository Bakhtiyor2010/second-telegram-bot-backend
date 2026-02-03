const db = require("../config/db");
const admin = require("firebase-admin");

// 🔹 Mark as Paid
async function setPaid(userId, name, surname, month, year) {
  if (!userId || !month || !year) throw new Error("userId, month, and year required");

  const paidAtTimestamp = admin.firestore.Timestamp.now();
  const monthKey = `${month}-${year}`;

  const userRef = db.collection("payments").doc(userId);
  const historyRef = userRef.collection("history").doc(monthKey);

  await userRef.set(
    {
      currentStatus: "paid",
      paidAt: paidAtTimestamp,
      unpaidFrom: null,
      name,
      surname,
    },
    { merge: true }
  );

  await historyRef.set({
    status: "paid",
    name,
    surname,
    date: paidAtTimestamp,
    monthKey,
  });

  return { paidAt: paidAtTimestamp.toDate(), monthKey };
}

// 🔹 Mark as Unpaid
async function setUnpaid(userId, name = "-", surname = "-", month, year) {
  if (!userId || !month || !year) throw new Error("userId, month, and year required");

  const unpaidAtTimestamp = admin.firestore.Timestamp.now();
  const monthKey = `${month}-${year}`;

  const userRef = db.collection("payments").doc(userId);
  const historyRef = userRef.collection("history").doc(monthKey);

  await userRef.set(
    {
      currentStatus: "unpaid",
      unpaidFrom: unpaidAtTimestamp,
      paidAt: null,
      name,
      surname,
    },
    { merge: true }
  );

  await historyRef.set({
    status: "unpaid",
    name,
    surname,
    date: unpaidAtTimestamp,
    monthKey,
  });

  return { unpaidAt: unpaidAtTimestamp.toDate(), monthKey };
}

// 🔹 Get all payments
async function getAllPayments() {
  const payments = {};

  // Use collectionGroup "history"
  const newSnap = await db.collectionGroup("history").get();
  newSnap.forEach((doc) => {
    const parentDoc = doc.ref.parent.parent;
    if (!parentDoc) return;
    const userId = parentDoc.id;
    const h = doc.data();

    if (!payments[userId]) payments[userId] = { history: [] };

    let dateObj = null;
    if (h.date && h.date.toDate) dateObj = h.date.toDate();

    payments[userId].history.push({
      status: h.status || "unknown",
      name: h.name || "-",
      surname: h.surname || "-",
      date: dateObj,
      monthKey: h.monthKey || null,
    });
  });

  // Keep old logic for payments collection if needed
  const oldSnap = await db.collection("payments").get();
  oldSnap.forEach((doc) => {
    const data = doc.data();
    if (!Array.isArray(data.history)) return;
    if (!payments[doc.id]) payments[doc.id] = { history: [] };

    data.history.forEach((h) => {
      let dateObj = null;
      if (h.date && h.date.toDate) dateObj = h.date.toDate();

      payments[doc.id].history.push({
        status: h.status || "unknown",
        name: h.name || "-",
        surname: h.surname || "-",
        date: dateObj,
        monthKey: h.monthKey || null,
      });
    });
  });

  return payments;
}

module.exports = {
  setPaid,
  setUnpaid,
  getAllPayments,
};
