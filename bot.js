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

// 🔹 /start komandasi
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Foydalanuvchi hali ro'yxatdan o'tmagan bo'lsa
  const snapshot = await usersCollection.doc(String(chatId)).get();
  if (snapshot.exists) {
    return sendMessage(chatId, "Siz allaqachon ro‘yxatdan o‘tgan ekansiz. /update bilan yangilashingiz mumkin.");
  }

  // Foydalanuvchi state boshlash
  userStates[chatId] = { step: "ask_name" };

  await sendMessage(chatId, "Assalomu alaykum! Fayzullaev IELTS School botiga xush kelibsiz!");
  await sendMessage(chatId, "Iltimos, ismingizni kiriting:");
});

// 🔹 /update komandasi
bot.onText(/\/update/, async (msg) => {
  const chatId = msg.chat.id;
  const snapshot = await usersCollection.where("telegramId", "==", chatId).get();

  if (snapshot.empty) {
    return sendMessage(chatId, "Siz hali ro‘yxatdan o‘tmagansiz. /start ni bosing.");
  }

  userStates[chatId] = { step: "update_name" };
  await sendMessage(chatId, "Iltimos, yangi ismingizni kiriting:");
});

// 🔹 /delete komandasi
bot.onText(/\/delete/, async (msg) => {
  const chatId = msg.chat.id;
  const snapshot = await usersCollection.where("telegramId", "==", chatId).get();

  if (!snapshot.empty) {
    const docId = snapshot.docs[0].id;
    await usersCollection.doc(docId).delete();
    delete userStates[chatId];
    return sendMessage(chatId, "Sizning ma’lumotlaringiz o‘chirildi. /start bilan qayta ro‘yxatdan o‘ting.");
  }

  sendMessage(chatId, "Siz hali ro‘yxatdan o‘tmagansiz.");
});

// 🔹 /payment komandasi
bot.onText(/\/payment/, async (msg) => {
  const userId = msg.chat.id;

  const doc = await db.collection("payments").doc(String(userId)).get();

  if (!doc.exists) {
    return bot.sendMessage(
      userId,
      "❌ Sizda faol to‘lov mavjud emas."
    );
  }

  const { paidAt } = doc.data();

  const d = paidAt.toDate();
  const date =
    String(d.getDate()).padStart(2, "0") + "/" +
    String(d.getMonth() + 1).padStart(2, "0") + "/" +
    d.getFullYear();

  await bot.sendMessage(
    userId,
    `✅ To‘lov qabul qilingan.
📅 Sana: ${date}`
  );
});

// 🔹 Callback query (inline buttons)
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const state = userStates[chatId];
  if (!state) return bot.answerCallbackQuery(query.id);

  try {
    const groupId = query.data;
    const groupDoc = await groupsCollection.doc(groupId).get();
    const groupName = groupDoc.data()?.name || "Unknown";

    if (state.step === "ask_group") {
      state.groupId = groupId;
      await usersCollection.doc(String(chatId)).set({
        telegramId: chatId,
        name: state.name,
        surname: state.surname,
        phone: state.phone,
        groupId,
        role: "moderator",
        createdAt: new Date()
      });
      await sendMessage(chatId, `Rahmat, ${state.name} ${state.surname}! Siz ${groupName} guruhiga qo‘shildingiz.`);
      delete userStates[chatId];

    } else if (state.step === "update_group") {
      state.groupId = groupId;
      const snapshot = await usersCollection.where("telegramId", "==", chatId).get();
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await usersCollection.doc(docId).update({
          name: state.name,
          surname: state.surname,
          phone: state.phone,
          groupId
        });
      }
      await sendMessage(chatId, `Sizning ma’lumotlaringiz yangilandi va guruhingiz ${groupName} bo‘ldi.`);
      delete userStates[chatId];
    }

    await bot.answerCallbackQuery(query.id);

  } catch (err) {
    console.error(err);
    sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// 🔹 Matnli xabarlarni qabul qilish
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates[chatId];
  if (!state) return;

  try {
    if (state.step === "ask_name") {
      state.name = text;
      state.step = "ask_surname";
      return sendMessage(chatId, "Familiyangizni kiriting:");

    } else if (state.step === "ask_surname") {
      state.surname = text;
      state.step = "ask_phone";
      return sendMessage(chatId, "Telefon raqamingizni kiriting (masalan +998901234567 yoki 901234567):");

    } else if (state.step === "ask_phone") {
      state.phone = text;
      const groupsSnapshot = await groupsCollection.get();

      if (groupsSnapshot.empty) {
        delete userStates[chatId];
        return sendMessage(chatId, "Hozircha guruhlar mavjud emas. Admin bilan bog'laning.");
      }

      const buttons = groupsSnapshot.docs.map(g => [{ text: g.data().name, callback_data: g.id }]);
      state.step = "ask_group";
      return sendMessage(chatId, "Iltimos, guruhingizni tanlang:", { reply_markup: { inline_keyboard: buttons } });

    } else if (state.step === "update_name") {
      state.name = text;
      state.step = "update_surname";
      return sendMessage(chatId, "Familiyangizni kiriting:");

    } else if (state.step === "update_surname") {
      state.surname = text;
      state.step = "update_phone";
      return sendMessage(chatId, "Telefon raqamingizni kiriting (masalan +998901234567 yoki 901234567):");

    } else if (state.step === "update_phone") {
      state.phone = text;
      const groupsSnapshot = await groupsCollection.get();

      if (groupsSnapshot.empty) {
        delete userStates[chatId];
        return sendMessage(chatId, "Hozircha guruhlar mavjud emas. Admin bilan bog'laning.");
      }

      const buttons = groupsSnapshot.docs.map(g => [{ text: g.data().name, callback_data: g.id }]);
      state.step = "update_group";
      return sendMessage(chatId, "Iltimos, yangi guruhingizni tanlang:", { reply_markup: { inline_keyboard: buttons } });
    }

  } catch (err) {
    console.error(err);
    sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

module.exports = bot;
