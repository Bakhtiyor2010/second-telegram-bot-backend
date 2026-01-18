const admin = require("firebase-admin");
const db = admin.firestore();

// 🔹 Attendance qo‘shish
async function addAttendance(userId, status, name, surname) {
  console.log("addAttendance called with:", { userId, status, name, surname });
  const date = admin.firestore.Timestamp.now();
  const docRef = db.collection("attendance").doc(userId);

  try {
    const doc = await docRef.get();
    const record = { status, name, surname, date };

    if (doc.exists) {
      await docRef.update({
        history: admin.firestore.FieldValue.arrayUnion(record),
      });
    } else {
      await docRef.set({
        history: [record],
      });
    }

    return { date: date.toDate() };
  } catch (err) {
    console.error("Firestore error in addAttendance:", err);
    throw err; // throw qilib frontendga yetkazamiz
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

module.exports = {
  addAttendance,
  getAllAttendance,
};
