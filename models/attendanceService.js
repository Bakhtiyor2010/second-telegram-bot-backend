const admin = require("firebase-admin");
const db = admin.firestore();

// 🔹 Attendance qo‘shish
async function addAttendance(
  telegramId,
  status,
  name,
  surname,
  phone,
  groupName,
  adminName // <-- shu yerda admin username keladi
) {
  if (!telegramId || !status) throw new Error("Invalid attendance data");

  const today = new Date().toISOString().split("T")[0];
  const docRef = db.collection("attendance").doc(String(telegramId));
  const doc = await docRef.get();

  let history = [];
  if (doc.exists && Array.isArray(doc.data().history)) history = doc.data().history;

  const todayIndex = history.findIndex(h => h.day === today);

  const record = {
    day: today,
    status,
    name,
    surname,
    phone,
    groupName,
    admin: adminName || "Admin", // <-- POST dan kelgan admin username
    updatedAt: admin.firestore.Timestamp.now(),
  };

  if (todayIndex !== -1) history[todayIndex] = record;
  else history.push(record);

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
        phone: h.phone || "",
        groupName: h.groupName || "",
        admin: h.admin || "", // <-- shu yerda frontend-da admin ko‘rinadi
        status: h.status,
        date: h.updatedAt instanceof admin.firestore.Timestamp
          ? h.updatedAt.toDate()
          : new Date(h.updatedAt),
      });
    });
  });

  return result;
}

// 🔹 Bitta foydalanuvchi uchun history
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
        date:
          h.updatedAt instanceof admin.firestore.Timestamp
            ? h.updatedAt.toDate()
            : new Date(h.updatedAt),
      }))
    : [];
}

module.exports = {
  addAttendance,
  getAllAttendance,
  getUserAttendance,
};
