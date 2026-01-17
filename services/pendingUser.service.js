const admin = require("firebase-admin");
const db = admin.firestore();

async function createPendingUser(userData) {
  const ref = db.collection("users_pending").doc(String(userData.telegramId));

  await ref.set({
    ...userData,
    status: "pending",
    createdAt: new Date(),
  });
}

module.exports = { createPendingUser };