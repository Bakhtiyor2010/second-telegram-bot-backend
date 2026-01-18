const admin = require("firebase-admin");
const db = admin.firestore();

// 🔹 Attendance qo‘shish
async function addAttendance(userId, status, name, surname) {
  if (!userId) throw new Error("Invalid userId");

  const date = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection("attendance").doc(userId);
  const doc = await docRef.get();

  const record = { status, name, surname, date };

  if (doc.exists) {
    await docRef.update({
      history: admin.firestore.FieldValue.arrayUnion(record),
    });
  } else {
    await docRef.set({ history: [record] });
  }

  // Server timestamp bilan frontend ishlashi uchun JS date qaytarish
  return { date: new Date() };
}

// 🔹 Barcha attendancelarni olish
async function getAllAttendance() {
  const snap = await db.collection("attendance").get();
  const attendance = {};

  snap.forEach(doc => {
    const data = doc.data();
    attendance[doc.id] = {
      history: (data.history || []).map(h => ({
        status: h.status,
        name: h.name,
        surname: h.surname,
        date: h.date && h.date.toDate ? h.date.toDate() : null,
      }))
    };
  });

  return attendance;
}

module.exports = { addAttendance, getAllAttendance };
