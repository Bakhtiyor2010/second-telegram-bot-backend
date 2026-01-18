const admin = require("firebase-admin");
const db = admin.firestore();

async function saveAttendance({ userId, status }) {
  const today = new Date().toISOString().slice(0, 10);

  await db.collection("attendance_history").add({
    userId: String(userId),
    status, // present | absent
    date: today,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

module.exports = { saveAttendance };
