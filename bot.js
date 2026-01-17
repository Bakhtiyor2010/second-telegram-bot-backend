require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const admin = require("firebase-admin");
const db = admin.firestore();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const userStates = {}; // ChatID bo'yicha foydalanuvchi state

// Helper: Xabar yuborish
async function sendMessage(chatId, text, options = {}) {
  try {
    await bot.sendMessage(chatId, text, options);
  } catch (err) {
    console.error("Failed to send message:", err);
  }
}

// /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // User approved users da bormi?
  const approvedSnap = await db.collection("users").doc(String(chatId)).get();
  if (approvedSnap.exists) {
    return sendMessage(chatId, "Siz allaqachon ro‘yxatdan o‘tgan ekansiz. /update bilan yangilashingiz mumkin.");
  }

  // User pending users da bormi?
  const pendingSnap = await db.collection("users_pending").doc(String(chatId)).get();
  if (pendingSnap.exists) {
    return sendMessage(chatId, "Siz hali admin tasdig‘ini kutmoqdasiz. Iltimos, biroz kuting.");
  }

  userStates[chatId] = { step: "ask_name" };

  await sendMessage(chatId, "Assalomu alaykum! Fayzullaev IELTS School botiga xush kelibsiz!");
  await sendMessage(chatId, "Iltimos, ismingizni kiriting:");
});

// Matnli xabarlarni qabul qilish
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
      // Guruhlarni olish
      const groupsSnapshot = await db.collection("groups").get();

      if (groupsSnapshot.empty) {
        delete userStates[chatId];
        return sendMessage(chatId, "Hozircha guruhlar mavjud emas. Admin bilan bog'laning.");
      }

      const buttons = groupsSnapshot.docs.map(g => [{ text: g.data().name, callback_data: g.id }]);
      state.step = "ask_group";
      return sendMessage(chatId, "Iltimos, guruhingizni tanlang:", { reply_markup: { inline_keyboard: buttons } });
    }
  } catch (err) {
    console.error(err);
    sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// Callback query (inline buttons)
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const state = userStates[chatId];
  if (!state) return bot.answerCallbackQuery(query.id);

  try {
    const groupId = query.data;
    const groupDoc = await db.collection("groups").doc(groupId).get();
    const groupName = groupDoc.data()?.name || "Unknown";

    if (state.step === "ask_group") {
      // ✅ FAqat pending users ga qo‘shiladi
      await db.collection("users_pending").doc(String(chatId)).set({
        telegramId: chatId,
        firstName: state.name,
        lastName: state.surname,
        phone: state.phone,
        selectedGroupId: groupId,
        status: "pending",
        createdAt: new Date(),
      });

      await sendMessage(chatId, `Rahmat, ${state.name} ${state.surname}! Sizning arizangiz admin tasdig‘ini kutmoqda. Guruh: ${groupName}`);
      delete userStates[chatId];
    }

    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error(err);
    sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

module.exports = bot;