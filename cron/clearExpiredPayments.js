const admin = require("firebase-admin");
const db = admin.firestore();

async function clearExpiredPayments() {
  const now = new Date();
  const snap = await db.collection("payments").get();

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.endDate && data.endDate.toDate() < now) {
      await db.collection("payments").doc(doc.id).delete();
      console.log("Expired payment deleted:", doc.id);
    }
  }
}

module.exports = clearExpiredPayments;