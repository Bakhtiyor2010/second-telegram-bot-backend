require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const usersCollection = require("./models/User");
const groupsCollection = require("./models/Group");
const admin = require("firebase-admin");
const db = admin.firestore();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const userStates = {}; // ChatID bo'yicha foydalanuvchi state

// 🔹 Foydalanuvchiga xabar yuborish helper
async function sendMessage(chatId, text, options = {}) {
  try {
    await bot.sendMessage(chatId, text, options);
  } catch (err) {
    console.error("Failed to send message:", err);
  }
}

// /start komandasi
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const snapshot = await usersCollection.doc(String(chatId)).get();
    if (snapshot.exists) return sendMessage(chatId, "Siz allaqachon ro‘yxatdan o‘tgan ekansiz. /update bilan yangilashingiz mumkin.");

    userStates[chatId] = { step: "ask_name" };
    await sendMessage(chatId, "Assalomu alaykum! Fayzullaev IELTS School botiga xush kelibsiz!");
    await sendMessage(chatId, "Iltimos, ismingizni kiriting:");
  } catch (err) {
    console.error(err);
    sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// /update komandasi
bot.onText(/\/update/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const snapshot = await usersCollection.doc(String(chatId)).get();
    if (!snapshot.exists) return sendMessage(chatId, "Siz hali ro‘yxatdan o‘tmagansiz. /start ni bosing.");

    userStates[chatId] = { step: "update_name" };
    await sendMessage(chatId, "Iltimos, yangi ismingizni kiriting:");
  } catch (err) {
    console.error(err);
    sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// /delete komandasi
bot.onText(/\/delete/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const snapshot = await usersCollection.doc(String(chatId)).get();
    if (!snapshot.exists) return sendMessage(chatId, "Siz hali ro‘yxatdan o‘tmagansiz.");

    await usersCollection.doc(String(chatId)).delete();
    delete userStates[chatId];
    sendMessage(chatId, "Sizning ma’lumotlaringiz o‘chirildi. /start bilan qayta ro‘yxatdan o‘ting.");
  } catch (err) {
    console.error(err);
    sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// /payment komandasi
bot.onText(/\/payment/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const userSnap = await usersCollection.doc(String(chatId)).get();
    if (!userSnap.exists) {
      return sendMessage(chatId, "Siz hali ro‘yxatdan o‘tmagansiz. /start ni bosing.");
    }

    const paymentsSnap = await db.collection("payments")
      .where("userId", "==", chatId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (paymentsSnap.empty) {
      return sendMessage(chatId, "Sizda hali to‘lovlar qabul qilinmagan.");
    }

    const payment = paymentsSnap.docs[0].data();
    const paymentDate = payment.createdAt?.toDate ? payment.createdAt.toDate() : payment.createdAt;

    sendMessage(chatId, `Oxirgi to‘lov qabul qilingan sana: ${paymentDate.toLocaleDateString()}`);
  } catch (err) {
    console.error(err);
    sendMessage(chatId, "To‘lov ma’lumotlarini olishda xato yuz berdi.");
  }
});

// callback query
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const state = userStates[chatId];
  if (!state) return bot.answerCallbackQuery(query.id);

  try {
const groupId = query.data;
const groupDoc = await groupsCollection.doc(groupId).get();
const groupName = groupDoc.exists ? groupDoc.data().name : "—";

    if (!state.name || !state.surname || !state.phone) {
      return sendMessage(chatId, "Iltimos, barcha ma'lumotlarni to‘liq kiriting.");
    }

    if (state.step === "ask_group") {
      // pending user yaratish
      const pendingCollection = db.collection("users_pending");
      await pendingCollection.doc(String(chatId)).set({
        telegramId: chatId,
        firstName: state.name,
        lastName: state.surname,
        phone: state.phone,
        groupId,      // callback query dan kelgan groupId
        groupName,    // shu yerda groupName to‘g‘ri saqlanadi
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await sendMessage(chatId, `Rahmat, ${state.name} ${state.surname}! Admin tasdig'ini kuting.`);
      delete userStates[chatId];
    }

    if (state.step === "update_group") {
      const snapshot = await usersCollection.where("telegramId", "==", chatId).get();
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await usersCollection.doc(docId).update({
          name: state.name,
          surname: state.surname,
          phone: state.phone,
          groupId,
          groupName,
        });
      }
      await sendMessage(chatId, `Sizning ma’lumotlaringiz yangilandi va guruhingiz ${groupName} bo‘ldi.`);
      delete userStates[chatId];
    }

    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error("BOT ERROR:", err);
    sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// matnli xabarlar
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates[chatId];
  if (!state) return;

  try {
    switch (state.step) {
      case "ask_name":
        state.name = text;
        state.step = "ask_surname";
        return sendMessage(chatId, "Familiyangizni kiriting:");
      case "ask_surname":
        state.surname = text;
        state.step = "ask_phone";
        return sendMessage(chatId, "Telefon raqamingizni kiriting (masalan +998901234567 yoki 901234567):");
      case "ask_phone":
        state.phone = text;
        const groupsSnapshot = await groupsCollection.get();
        if (groupsSnapshot.empty) {
          delete userStates[chatId];
          return sendMessage(chatId, "Hozircha guruhlar mavjud emas. Admin bilan bog'laning.");
        }
        const buttons = groupsSnapshot.docs.map(g => [{ text: g.data().name, callback_data: g.id }]);
        state.step = "ask_group";
        return sendMessage(chatId, "Iltimos, guruhingizni tanlang:", { reply_markup: { inline_keyboard: buttons } });
      case "update_name":
        state.name = text;
        state.step = "update_surname";
        return sendMessage(chatId, "Familiyangizni kiriting:");
      case "update_surname":
        state.surname = text;
        state.step = "update_phone";
        return sendMessage(chatId, "Telefon raqamingizni kiriting (masalan +998901234567 yoki 901234567):");
      case "update_phone":
        state.phone = text;
        const groupsSnap = await groupsCollection.get();
        if (groupsSnap.empty) {
          delete userStates[chatId];
          return sendMessage(chatId, "Hozircha guruhlar mavjud emas. Admin bilan bog'laning.");
        }
        const btns = groupsSnap.docs.map(g => [{ text: g.data().name, callback_data: g.id }]);
        state.step = "update_group";
        return sendMessage(chatId, "Iltimos, yangi guruhingizni tanlang:", { reply_markup: { inline_keyboard: btns } });
    }
  } catch (err) {
    console.error("BOT ERROR:", err);
    sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

module.exports = bot;
