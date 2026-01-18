const admin = require("firebase-admin");
const db = admin.firestore();

// 🔹 Attendance qo‘shish
async function addAttendance(userId, status, name, surname) {
  if (!userId) throw new Error("Invalid userId");

  const date = admin.firestore.Timestamp.now(); // Firestore Timestamp
  const docRef = db.collection("attendance").doc(userId);

  const record = { status, name, surname, date };

  try {
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.update({
        history: admin.firestore.FieldValue.arrayUnion(record),
      });
    } else {
      await docRef.set({
        history: [record],
      });
    }
    return { date: date.toDate() }; // JS Date
  } catch (err) {
    console.error("Firestore error in addAttendance:", err);
    throw err;
  }
}

// 🔹 Barcha attendancelarni olish
async function getAllAttendance() {
  const snap = await db.collection("attendance").get();
  const attendance = {};

  snap.forEach((doc) => {
    const data = doc.data();
    attendance[doc.id] = {
      history: data.history
        ? data.history.map((h) => ({
            status: h.status,
            name: h.name,
            surname: h.surname,
            date:
              h.date instanceof admin.firestore.Timestamp
                ? h.date.toDate()
                : new Date(h.date),
          }))
        : [],
    };
  });

  return attendance;
}

// 🔹 Bitta foydalanuvchi uchun attendance history olish
async function getUserAttendance(userId) {
  if (!userId) return [];
  const docRef = db.collection("attendance").doc(userId);
  const doc = await docRef.get();
  if (!doc.exists) return [];
  
  const data = doc.data();
  return data.history
    ? data.history.map(h => ({
        status: h.status,
        name: h.name,
        surname: h.surname,
        date: h.date instanceof admin.firestore.Timestamp ? h.date.toDate() : new Date(h.date)
      }))
    : [];
}

module.exports = {
  addAttendance,
  getAllAttendance,
  getUserAttendance, // yangi qo‘shildi
};