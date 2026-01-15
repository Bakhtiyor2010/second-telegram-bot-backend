require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const usersCollection = require("./models/User");
const groupsCollection = require("./models/Group");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const userStates = {};

// /start komandasi
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { step: "ask_name" };

  try {
    await bot.sendMessage(
      chatId,
      "Salom! Fayzullaev IELTS School botiga xush kelibsiz!\n" +
      "Ma’lumotlaringizni o'zgartirmoqchi bo'lsangiz /update, botni tark etmoqchi bo'lsangiz /delete ni bosing."
    );
    await bot.sendMessage(chatId, "Iltimos, ismingizni kiriting:");
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// /update komandasi
bot.onText(/\/update/, async (msg) => {
  const chatId = msg.chat.id;
  delete userStates[chatId];

  try {
    const snapshot = await usersCollection.where("telegramId", "==", chatId).get();
    if (snapshot.empty) {
      bot.sendMessage(chatId, "Siz hali ro‘yxatdan o‘tmagansiz. /start ni bosing.");
      return;
    }

    userStates[chatId] = { step: "update_name" };
    await bot.sendMessage(chatId, "Iltimos, yangi ismingizni kiriting:");
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// /delete komandasi
bot.onText(/\/delete/, async (msg) => {
  const chatId = msg.chat.id;
  delete userStates[chatId];

  try {
    const snapshot = await usersCollection.where("telegramId", "==", chatId).get();
    if (!snapshot.empty) {
      const docId = snapshot.docs[0].id;
      await usersCollection.doc(docId).delete();
      bot.sendMessage(chatId, "Sizning ma’lumotlaringiz o‘chirildi. /start bilan qayta ro‘yxatdan o‘ting.");
    } else {
      bot.sendMessage(chatId, "Siz hali ro‘yxatdan o‘tmagansiz.");
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// Har qanday matnli xabarni qabul qilish
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates[chatId];
  if (!state) return;

  try {
    if (state.step === "ask_name") {
      state.name = text;
      state.step = "ask_surname";
      await bot.sendMessage(chatId, "Familiyangizni kiriting:");
    } else if (state.step === "ask_surname") {
      state.surname = text;
      state.step = "ask_phone";
      await bot.sendMessage(chatId, "Telefon raqamingizni kiriting (masalan +998901234567):");
    } else if (state.step === "ask_phone") {
      state.phone = text;

      const groupsSnapshot = await groupsCollection.get();
      if (groupsSnapshot.empty) {
        await bot.sendMessage(chatId, "Hozircha guruhlar mavjud emas. Admin bilan bog'laning.");
        delete userStates[chatId];
        return;
      }

      const buttons = groupsSnapshot.docs.map(g => [{ text: g.data().name, callback_data: g.id }]);
      await bot.sendMessage(chatId, "Iltimos, guruhingizni tanlang:", { reply_markup: { inline_keyboard: buttons } });

      state.step = "ask_group";
    } else if (state.step === "update_name") {
      state.name = text;
      state.step = "update_surname";
      await bot.sendMessage(chatId, "Familiyangizni kiriting:");
    } else if (state.step === "update_surname") {
      state.surname = text;
      state.step = "update_phone";
      await bot.sendMessage(chatId, "Telefon raqamingizni kiriting (masalan +998901234567):");
    } else if (state.step === "update_phone") {
      state.phone = text;

      const groupsSnapshot = await groupsCollection.get();
      if (groupsSnapshot.empty) {
        await bot.sendMessage(chatId, "Hozircha guruhlar mavjud emas. Admin bilan bog'laning.");
        delete userStates[chatId];
        return;
      }
      const buttons = groupsSnapshot.docs.map(g => [{ text: g.data().name, callback_data: g.id }]);
      await bot.sendMessage(chatId, "Iltimos, yangi guruhingizni tanlang:", { reply_markup: { inline_keyboard: buttons } });

      state.step = "update_group";
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// Callback query
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const state = userStates[chatId];
  if (!state) return;

  try {
    if (state.step === "ask_group") {
      const groupId = query.data;
      state.groupId = groupId;

      await usersCollection.doc(chatId.toString()).set({
        telegramId: chatId,
        name: state.name,
        surname: state.surname,
        phone: state.phone,
        groupId: state.groupId,
        role: "moderator",
        createdAt: new Date()
      });

      const groupName = await groupsCollection.doc(groupId).get().then(doc => doc.data().name);
      await bot.sendMessage(chatId, `Rahmat, ${state.name} ${state.surname}! Siz ${groupName} guruhiga qo‘shildingiz.`);
      delete userStates[chatId];
    } else if (state.step === "update_group") {
      const groupId = query.data;
      state.groupId = groupId;

      const snapshot = await usersCollection.where("telegramId", "==", chatId).get();
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await usersCollection.doc(docId).update({
          name: state.name,
          surname: state.surname,
          phone: state.phone,
          groupId: groupId
        });
      }

      const groupName = await groupsCollection.doc(groupId).get().then(doc => doc.data().name);
      await bot.sendMessage(chatId, `Sizning ma’lumotlaringiz yangilandi va guruhingiz ${groupName} bo‘ldi.`);
      delete userStates[chatId];
    }

    await bot.answerCallbackQuery(query.id);

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

module.exports = bot;
