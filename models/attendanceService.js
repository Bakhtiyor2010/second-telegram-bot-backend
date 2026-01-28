const db = require("../config/db");
const admin = require("firebase-admin");

// Add attendance
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

  await historyRef.set(record);

  return record;
}

// Get all attendance
async function getAllAttendance() {
  const result = [];

  try {
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
        date: h.updatedAt ? h.updatedAt.toDate() : null,
      });
    });

    // Old structure fallback
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
          date: h.updatedAt ? h.updatedAt.toDate() : null,
        });
      });
    });
  } catch (err) {
    console.error("Failed to fetch attendance:", err);
  }

  return result;
}

// Get single user history
async function getUserAttendance(userId) {
  if (!userId) return [];
  const result = [];
  const userRef = db.collection("attendance").doc(userId);

  try {
    const newSnap = await userRef.collection("history").get();
    newSnap.forEach(doc => {
      const h = doc.data();
      result.push({
        status: h.status,
        name: h.name,
        surname: h.surname,
        date: h.updatedAt ? h.updatedAt.toDate() : null,
      });
    });

    const oldDoc = await userRef.get();
    const data = oldDoc.data();
    if (Array.isArray(data?.history)) {
      data.history.forEach(h => {
        result.push({
          status: h.status,
          name: h.name,
          surname: h.surname,
          date: h.updatedAt ? h.updatedAt.toDate() : null,
        });
      });
    }
  } catch (err) {
    console.error("Failed to fetch user attendance:", err);
  }

  return result.sort((a, b) => (b.date || 0) - (a.date || 0));
}

module.exports = {
  addAttendance,
  getAllAttendance,
  getUserAttendance,
};
