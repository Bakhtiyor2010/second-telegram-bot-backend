const admin = require("firebase-admin");
const db = admin.firestore();

// 🔹 Attendance qo‘shish
async function addAttendance(telegramId, status, name, surname) {
  if (!telegramId || !status) {
    throw new Error("Invalid attendance data");
  }

  // 🔑 BUGUNGI SANA (faqat kun)
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const docRef = db.collection("attendance").doc(String(telegramId));
  const doc = await docRef.get();

  let history = [];

  if (doc.exists && Array.isArray(doc.data().history)) {
    history = doc.data().history;
  }

  const todayIndex = history.findIndex(h => h.day === today);

  const record = {
    day: today,              // 🔑 unique key
    status,
    name: name || "",
    surname: surname || "",
    updatedAt: admin.firestore.Timestamp.now(),
  };

  if (todayIndex !== -1) {
    // 🔄 BUGUN BOR → UPDATE
    history[todayIndex] = record;
  } else {
    // ➕ BUGUN YO‘Q → PUSH
    history.push(record);
  }

  await docRef.set({ history }, { merge: true });

  return record;
}

// 🔹 Barcha attendancelarni olish
async function getAllAttendance() {
  const snap = await db.collection("attendance").get();
  const result = [];

  snap.forEach(doc => {
    const data = doc.data();
    if (!data.history) return;

    data.history.forEach(h => {
      result.push({
        telegramId: doc.id,
        name: h.name,
        surname: h.surname,
        status: h.status,
        date: h.date.toDate(),
      });
    });
  });

  return result;
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