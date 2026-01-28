const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const bot = require("../bot");

// POST — pending user qo‘shish
router.post("/", async (req, res) => {
  try {
    const {
      telegramId,
      firstName,
      lastName,
      phone,
      username,
      selectedGroupId,
    } = req.body;

    if (!telegramId || !firstName)
      return res
        .status(400)
        .json({ error: "telegramId va firstName majburiy" });

    const approvedSnap = await db
      .collection("users")
      .doc(String(telegramId))
      .get();
    if (approvedSnap.exists)
      return res.status(200).json({ message: "User already approved" });

    const pendingSnap = await db
      .collection("users_pending")
      .doc(String(telegramId))
      .get();
    if (pendingSnap.exists)
      return res.status(200).json({ message: "User already pending approval" });

    let groupName = "";
    if (selectedGroupId) {
      const groupDoc = await db.collection("groups").doc(selectedGroupId).get();
      groupName = groupDoc.exists ? groupDoc.data().name : "—";
    }

    // ✅ Safe add to users collection with merge to preserve old fields if exist
    await db
      .collection("users")
      .doc(String(telegramId))
      .set(
        {
          telegramId: telegramId,
          name: firstName || "",
          surname: lastName || "",
          phone: phone || "",
          username: username || "",
          groupId: selectedGroupId || "",
          groupName: groupName || "",
          status: "active",
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    try {
      await bot.sendMessage(
        telegramId,
        `Hurmatli ${firstName}, siz ro'yxatdan o'tdingiz. Admin tasdig‘ini kuting.\n\nУважаемый(ая) ${firstName}, вы зарегистрировались. Дождитесь подтверждения от администратора.`,
      );
    } catch (err) {
      console.error("Telegram notify failed:", err);
    }

    res.status(201).json({ message: "User added to users collection" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET — barcha approved users, guruh bo‘yicha filter
router.get("/", async (req, res) => {
  try {
    const { groupId } = req.query;
    let query = db.collection("users");
    if (groupId) query = query.where("groupId", "==", groupId);

    const snapshot = await query.get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT — user info yangilash (safe merge)
router.put("/:id", async (req, res) => {
  try {
    const userId = String(req.params.id);
    const userRef = db.collection("users").doc(userId);

    const oldDoc = await userRef.get();
    if (!oldDoc.exists)
      return res.status(404).json({ error: "User not found" });

    const oldData = oldDoc.data();
    const allowedFields = ["name", "surname", "phone", "groupId"];
    let updateData = {};

    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updateData[f] = req.body[f];
      }
    });

    // Agar groupId o'zgargan bo'lsa → groupName ni yangilaymiz
    if (req.body.groupId !== undefined) {
      const groupDoc = await db
        .collection("groups")
        .doc(req.body.groupId)
        .get();
      updateData.groupName = groupDoc.exists ? groupDoc.data().name : "";
    }

    if (!Object.keys(updateData).length) {
      return res.json({ message: "No valid fields provided" });
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // 🔹 UPDATE with merge
    await userRef.set(updateData, { merge: true });

    const newDoc = await userRef.get();
    const newData = newDoc.data();

    let changes = [];

    if (oldData.name !== newData.name)
      changes.push(
        `Ism / Имя: ${oldData.name || "-"} → ${newData.name || "-"}`,
      );
    if (oldData.surname !== newData.surname)
      changes.push(
        `Familiya / Фамилия: ${oldData.surname || "-"} → ${newData.surname || "-"}`,
      );
    if (oldData.phone !== newData.phone)
      changes.push(
        `Telefon / Телефон: ${oldData.phone || "-"} → ${newData.phone || "-"}`,
      );
    if (oldData.groupName !== newData.groupName)
      changes.push(
        `Guruh / Группа: ${oldData.groupName || "-"} → ${newData.groupName || "-"}`,
      );

    if (changes.length) {
      const changeText = changes.join("\n");

      try {
        await bot.sendMessage(
          userId,
          `✏️ Ma'lumotlaringiz tahrirlandi:\n✏️ Ваши данные были изменены:\n\n${changeText}\n\nAgar bu o‘zgarish siz tomoningizdan qilinmagan bo‘lsa, admin bilan bog‘laning.\nЕсли это сделали не вы, свяжитесь с администратором.`,
        );
      } catch (err) {
        console.error("User notify error:", err);
      }

      try {
        if (process.env.ADMIN_CHANNEL_ID) {
          await bot.sendMessage(
            process.env.ADMIN_CHANNEL_ID,
            `✏️ USER EDITED\n\nID: ${userId}\n\n${changeText}`,
          );
        }
      } catch (err) {
        console.error("Admin notify error:", err);
      }
    }

    res.json({ id: newDoc.id, ...newData });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE — user o‘chirish
const usersCollection = db.collection("users");
router.delete("/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const userRef = usersCollection.doc(String(userId));
    const userDoc = await userRef.get();

    if (!userDoc.exists)
      return res.status(404).json({ error: "User not found" });

    const { name = "", surname = "" } = userDoc.data();

    // ⚠️ Safe: only delete user, keep payments/history/logs intact
    await userRef.delete();

    try {
      await bot.sendMessage(
        userId,
        `Hurmatli ${name} ${surname}, siz tizimdan o'chirildingiz. Qayta ro'yxatdan o'tish uchun /start ni bosing!\n\nУважаемый(ая) ${name} ${surname}, вы были удалены из системы. Чтобы зарегистрироваться снова, нажмите /start!`,
      );
    } catch (botErr) {
      console.error("Bot xabari yuborilmadi:", botErr);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    return res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;