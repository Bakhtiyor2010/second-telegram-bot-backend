require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const usersCollection = require("./models/User");
const groupsCollection = require("./models/Group");
const admin = require("firebase-admin");
const db = admin.firestore();

const CHANNEL_ID = -1002130557970;
const CHANNEL_LINK = "https://t.me/Fayzullaev_IELTS_School";

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

// 🔹 Kanal a’zo tekshiruvi
async function isSubscribed(userId) {
  try {
    const member = await bot.getChatMember(CHANNEL_ID, userId);
    return ["member", "administrator", "creator"].includes(member.status);
  } catch (err) {
    return false;
  }
}

// 🔹 HAR COMMAND BOSHI OLDIN state-ni tozalash helper
function resetUserState(chatId) {
  if (userStates[chatId]) delete userStates[chatId];
}

// ====================== /start ======================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  resetUserState(chatId); // 🔹 Eski steplarni tozalash

  if (!(await isSubscribed(chatId))) {
    return sendMessage(
      chatId,
      `❗ Botdan foydalanish uchun kanalga a’zo bo‘ling:\n❗ Чтобы пользоваться ботом, подпишитесь на канал:\n\n👉 ${CHANNEL_LINK}`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "✅ A’zo bo‘ldim", callback_data: "check_sub" }]],
        },
      }
    );
  }

  const snapshot = await usersCollection.doc(String(chatId)).get();

  if (snapshot.exists) {
    return sendMessage(
      chatId,
      "Siz allaqachon ro‘yxatdan o‘tgan ekansiz. /update bilan yangilashingiz mumkin.\n\nВы уже зарегистрированы. Вы можете обновить данные с помощью команды /update."
    );
  }

  // 🔹 Yangilanish jarayonini boshlash
  userStates[chatId] = { step: "ask_name" };

  await sendMessage(
    chatId,
    "Assalomu alaykum! Fayzullaev IELTS School botiga xush kelibsiz!\n\nЗдравствуйте! Добро пожаловать в бот Fayzullaev IELTS School!"
  );
  await sendMessage(chatId, "Iltimos, ismingizni kiriting:\n\nПожалуйста, введите ваше имя:");
});

// ====================== /update ======================
bot.onText(/\/update/, async (msg) => {
  const chatId = msg.chat.id;

  resetUserState(chatId);

  try {
    const snapshot = await usersCollection.doc(String(chatId)).get();
    if (!snapshot.exists) {
      return sendMessage(
        chatId,
        "Siz hali ro‘yxatdan o‘tmagansiz. /start ni bosing.\n\nВы еще не зарегистрированы. Нажмите /start."
      );
    }

    userStates[chatId] = { step: "update_name" };
    return sendMessage(chatId, "Iltimos, yangi ismingizni kiriting:\n\nПожалуйста, введите ваше новое имя:");
  } catch (err) {
    console.error(err);
    sendMessage(chatId, "Server xatosi yuz berdi.\n\nПроизошла ошибка на сервере.");
  }
});

// ====================== /delete ======================
bot.onText(/\/delete/, async (msg) => {
  const chatId = msg.chat.id;

  resetUserState(chatId);

  try {
    const snapshot = await usersCollection.doc(String(chatId)).get();
    if (!snapshot.exists)
      return sendMessage(chatId, "Siz hali ro‘yxatdan o‘tmagansiz.\n\nВы еще не зарегистрированы.");

    await usersCollection.doc(String(chatId)).delete();
    sendMessage(chatId, "Sizning ma’lumotlaringiz o‘chirildi. /start bilan qayta ro‘yxatdan o‘ting.\n\nВаши данные были удалены. Пройдите регистрацию снова с помощью /start.");
  } catch (err) {
    console.error(err);
    sendMessage(chatId, "Server xatosi yuz berdi.\n\nПроизошла ошибка на сервере.");
  }
});

// ====================== /payment ======================
bot.onText(/\/payment/, async (msg) => {
  const chatId = msg.chat.id;

  resetUserState(chatId);

  try {
    const userSnap = await usersCollection.doc(String(chatId)).get();
    if (!userSnap.exists) {
      return sendMessage(chatId, "Siz hali ro‘yxatdan o‘tmagansiz. /start ni bosing.\n\nВы еще не зарегистрированы. Нажмите /start.");
    }

    const paymentsSnap = await db.collection("payments").doc(String(chatId)).get();
    if (!paymentsSnap.exists) {
      return sendMessage(chatId, "Sizda hali to‘lovlar qabul qilinmagan.\n\nУ вас пока не принято ни одной оплаты.");
    }

    const payment = paymentsSnap.data();
    const paymentDate = payment.paidAt?.toDate ? payment.paidAt.toDate() : payment.paidAt;

    const formattedDate = `${String(paymentDate.getDate()).padStart(2, "0")}/` +
      `${String(paymentDate.getMonth() + 1).padStart(2, "0")}/` +
      `${paymentDate.getFullYear()}`;

    sendMessage(chatId, `Oxirgi to‘lov qabul qilingan sana: ${formattedDate}\n\nДата последней принятой оплаты: ${formattedDate}`);
  } catch (err) {
    console.error(err);
    sendMessage(chatId, "To‘lov ma’lumotlarini olishda xato yuz berdi.\n\nПроизошла ошибка при получении информации о платежах.");
  }
});

// ====================== Callback query ======================
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const state = userStates[chatId];
  if (!state) return bot.answerCallbackQuery(query.id);

  try {
    if (query.data === "check_sub") {
      if (!(await isSubscribed(chatId))) {
        return bot.answerCallbackQuery(query.id, {
          text: "❌ Siz hali kanalga a’zo bo‘lmagansiz\n\n❌ Вы ещё не подписались на канал.",
          show_alert: true,
        });
      }

      await bot.answerCallbackQuery(query.id);
      resetUserState(chatId);
      return sendMessage(chatId, "✅ Rahmat! Endi botdan foydalanishingiz mumkin. /start ni bosing.\n\n✅ Спасибо! Теперь вы можете пользоваться ботом. Нажмите /start.");
    }

    // Callback faqat guruh tanlash steplarida ishlaydi
    if (!["ask_group", "update_group"].includes(state.step)) {
      return bot.answerCallbackQuery(query.id);
    }

    const groupId = query.data;
    const groupDoc = await groupsCollection.doc(groupId).get();
    const groupName = groupDoc.exists ? groupDoc.data().name : "—";

    if (!state.name || !state.surname || !state.phone) {
      return sendMessage(chatId, "Iltimos, barcha ma'lumotlarni to‘liq kiriting.\n\nПожалуйста, введите все данные полностью.");
    }

    if (state.step === "ask_group") {
      await db.collection("users_pending").doc(String(chatId)).set({
        telegramId: chatId,
        firstName: state.name,
        lastName: state.surname,
        phone: state.phone,
        groupId,
        groupName,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      sendMessage(chatId, `Rahmat, ${state.name} ${state.surname}! Admin tasdig'ini kuting.\n\nСпасибо, ${state.name} ${state.surname}! Дождитесь подтверждения от администратора.`);
      resetUserState(chatId);
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

      sendMessage(chatId, `Sizning ma’lumotlaringiz yangilandi va guruhingiz ${groupName} bo‘ldi.\n\nВаши данные были обновлены, и ваша группа теперь ${groupName}.`);
      resetUserState(chatId);
    }

    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error("BOT ERROR:", err);
    sendMessage(chatId, "Server xatosi yuz berdi.\n\nПроизошла ошибка на сервере.");
  }
});

// ====================== Message handler ======================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // 🔹 Agar foydalanuvchi command yuborsa, eski state ishlamasin
  if (text && text.startsWith("/")) return;

  const state = userStates[chatId];
  if (!state) return;

  try {
    switch (state.step) {
      case "ask_name":
        state.name = text;
        state.step = "ask_surname";
        return sendMessage(chatId, "Familiyangizni kiriting:\n\nВведите вашу фамилию:");
      case "ask_surname":
        state.surname = text;
        state.step = "ask_phone";
        return sendMessage(chatId, "Telefon raqamingizni kiriting (masalan +998901234567 yoki 901234567):\n\nВведите ваш номер телефона (например, +998901234567 или 901234567):");
      case "ask_phone":
        state.phone = text;

        const groupsSnapshot = await groupsCollection.get();
        if (groupsSnapshot.empty) {
          resetUserState(chatId);
          return sendMessage(chatId, "Hozircha guruhlar mavjud emas. Admin bilan bog'laning.\n\nПока что группы отсутствуют. Свяжитесь с администратором.");
        }

        const sortedGroups = groupsSnapshot.docs
          .map((g) => ({ id: g.id, name: g.data().name }))
          .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

        const buttons = sortedGroups.map((g) => [{ text: g.name, callback_data: g.id }]);
        state.step = "ask_group";
        return sendMessage(chatId, "Iltimos, guruhingizni tanlang:\n\nПожалуйста, выберите вашу группу:", { reply_markup: { inline_keyboard: buttons } });

      case "update_name":
        state.name = text;
        state.step = "update_surname";
        return sendMessage(chatId, "Familiyangizni kiriting:\n\nВведите вашу фамилию:");
      case "update_surname":
        state.surname = text;
        state.step = "update_phone";
        return sendMessage(chatId, "Telefon raqamingizni kiriting (masalan +998901234567 yoki 901234567):\n\nВведите ваш номер телефона (например, +998901234567 или 901234567):");
      case "update_phone":
        state.phone = text;

        const groupsSnap = await groupsCollection.get();
        if (groupsSnap.empty) {
          resetUserState(chatId);
          return sendMessage(chatId, "Hozircha guruhlar mavjud emas. Admin bilan bog'laning.\n\nПока что группы отсутствуют. Свяжитесь с администратором.");
        }

        const sortedGroupsUpdate = groupsSnap.docs
          .map((g) => ({ id: g.id, name: g.data().name }))
          .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

        const btns = sortedGroupsUpdate.map((g) => [{ text: g.name, callback_data: g.id }]);
        state.step = "update_group";
        return sendMessage(chatId, "Iltimos, guruhingizni tanlang:\n\nПожалуйста, выберите вашу группу:", { reply_markup: { inline_keyboard: btns } });
    }
  } catch (err) {
    console.error("BOT ERROR:", err);
    sendMessage(chatId, "Server xatosi yuz berdi.\n\nПроизошла ошибка на сервере.");
  }
});

module.exports = bot;