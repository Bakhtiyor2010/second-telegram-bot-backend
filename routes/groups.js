const express = require("express");
const admin = require("firebase-admin");
const db = admin.firestore();
const router = express.Router();
const groupsCollection = require("../models/Group");
const usersCollection = require("../models/User");
const bot = require("../bot");

// GET — barcha guruhlar
router.get("/", async (req, res) => {
  try {
    const snapshot = await groupsCollection.get();
    const groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST — group yaratish
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const newGroupRef = groupsCollection.doc();
    await newGroupRef.set({ name, createdAt: new Date() });

    res.json({ id: newGroupRef.id, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT — group nomini tahrirlash va userlarga xabar
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const groupId = req.params.id;

    // 🔹 GROUP nomini update
    await groupsCollection.doc(groupId).update({ name });

    // 🔹 Shu groupdagi userlarni olish
    const usersSnapshot = await usersCollection
      .where("groupId", "==", groupId)
      .get();

    const batch = db.batch();

    const notifyPromises = [];

    for (const doc of usersSnapshot.docs) {
      const userRef = usersCollection.doc(doc.id);
      batch.update(userRef, { groupName: name });

      const user = doc.data();
      if (user.telegramId) {
        notifyPromises.push(
          bot
            .sendMessage(
              user.telegramId,
              `ℹ️ Sizning guruh nomingiz "${name}" ga o'zgartirildi.

ℹ️ Название вашей группы было изменено на "${name}".`,
            )
            .catch(console.error),
        );
      }
    }

    await batch.commit();
    await Promise.all(notifyPromises);
  } catch (err) {
    console.error("GROUP UPDATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE — guruh + userlar + xabar
router.delete("/:id", async (req, res) => {
  try {
    const groupId = req.params.id;
    await groupsCollection.doc(groupId).delete();

    const usersSnapshot = await usersCollection
      .where("groupId", "==", groupId)
      .get();
    const promises = [];

    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      const userName = user.name || "-"; // 🔹 name mavjud bo‘lmasa "-"
      if (user.telegramId) {
        promises.push(
          bot
            .sendMessage(
              user.telegramId,
              `⚠️ Hurmatli ${userName}, sizning guruhingiz o‘chirildi.
            
⚠️ Уважаемый(ая) ${userName}, ваша группа была удалена.`,
            )
            .catch(console.error),
        );
      }
      promises.push(usersCollection.doc(doc.id).delete());
    }

    await Promise.all(promises);
    res.json({ message: "Group and its users deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete group and users" });
  }
});

module.exports = router;