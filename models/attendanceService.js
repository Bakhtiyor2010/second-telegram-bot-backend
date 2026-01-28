const db = require("../config/db");
const admin = require("firebase-admin");

// 🔹 Add attendance (WRITES ONLY NEW STRUCTURE)
async function addAttendance(
  telegramId,
  status,
  name,
  surname,
  phone,
  groupName,
  adminName
) {
  if (!telegramId || !status) throw new Error("Invalid attendance data");

  const today = new Date().toISOString().split("T")[0];

  const userRef = db.collection("attendance").doc(String(telegramId));
  const historyRef = userRef.collection("history").doc(today);

  await userRef.set({ name, surname, phone }, { merge: true });

  const record = {
    day: today,
    status,
    name,
    surname,
    phone,
    groupName,
    admin: adminName || "Admin",
    updatedAt: admin.firestore.Timestamp.now(),
  };

  await historyRef.set(record); // NO READ

  return record;
}

// 🔹 Barcha attendancelarni olish
async function getAllAttendance() {
  const result = [];

  // 🟢 NEW STRUCTURE
  const newSnap = await db.collectionGroup("history").get();
  newSnap.forEach(doc => {
    const h = doc.data();
    result.push({
      telegramId: doc.ref.parent.parent.id,
      name: h.name,
      surname: h.surname,
      phone: h.phone || "",
      groupName: h.groupName || "",
      admin: h.admin || "",
      status: h.status,
      date: h.updatedAt.toDate(),
    });
  });

  // 🟡 OLD STRUCTURE (fallback)
  const oldSnap = await db.collection("attendance").get();
  oldSnap.forEach(doc => {
    const data = doc.data();
    if (!Array.isArray(data.history)) return;

    data.history.forEach(h => {
      result.push({
        telegramId: doc.id,
        name: h.name,
        surname: h.surname,
        phone: h.phone || "",
        groupName: h.groupName || "",
        admin: h.admin || "",
        status: h.status,
        date: h.updatedAt.toDate(),
      });
    });
  });

  return result;
}

// 🔹 Bitta foydalanuvchi uchun history
async function getUserAttendance(userId) {
  if (!userId) return [];

  const userRef = db.collection("attendance").doc(userId);
  const result = [];

  // 🟢 New
  const newSnap = await userRef.collection("history").get();
  newSnap.forEach(doc => {
    const h = doc.data();
    result.push({
      status: h.status,
      name: h.name,
      surname: h.surname,
      date: h.updatedAt.toDate(),
    });
  });

  // 🟡 Old
  const oldDoc = await userRef.get();
  const data = oldDoc.data();
  if (Array.isArray(data?.history)) {
    data.history.forEach(h => {
      result.push({
        status: h.status,
        name: h.name,
        surname: h.surname,
        date: h.updatedAt.toDate(),
      });
    });
  }

  return result.sort((a, b) => b.date - a.date);
}

module.exports = {
  addAttendance,
  getAllAttendance,
  getUserAttendance,
};