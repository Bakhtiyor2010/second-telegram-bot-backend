const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Foydalanuvchini pending users ga qo'shish
 * @param {Object} userData - { telegramId, firstName, lastName, phone, username, selectedGroupId }
 */
async function createPendingUser(userData) {
  if (!userData.telegramId || !userData.firstName) {
    throw new Error("telegramId va firstName majburiy");
  }

  // 🔹 groupName olish
  let groupName = "";
  if (userData.selectedGroupId) {
    const groupDoc = await db.collection("groups").doc(userData.selectedGroupId).get();
    groupName = groupDoc.exists ? groupDoc.data().name : "";
  }

  const ref = db.collection("users_pending").doc(String(userData.telegramId));

  await ref.set({
    telegramId: userData.telegramId,
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    phone: userData.phone || "",
    username: userData.username || "",
    selectedGroupId: userData.selectedGroupId || "",
    groupName,          // 🔹 groupName qo‘shildi
    status: "pending",
    createdAt: new Date(),
  });
}

module.exports = { createPendingUser };