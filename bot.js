// --- OLD CODE SAQLANADI ---
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const admin = require("firebase-admin");
const db = admin.firestore();

const usersCollection = db.collection("users");
const pendingCollection = db.collection("users_pending");
const groupsCollection = db.collection("groups");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const userStates = {}; // ChatID bo'yicha foydalanuvchi state

async function sendMessage(chatId, text, options = {}) {
  try {
    await bot.sendMessage(chatId, text, options);
  } catch (err) {
    console.error("Failed to send message:", err);
  }
}

// --- /start komandasi saqlanadi ---
bot.onText(/\/start/, async (msg) => {
  const chatId = String(msg.chat.id);

  const approvedSnap = await usersCollection.doc(chatId).get();
  if (approvedSnap.exists) {
    return sendMessage(chatId, "Siz allaqachon ro‘yxatdan o‘tgan ekansiz. /update bilan yangilashingiz mumkin.");
  }

  const pendingSnap = await pendingCollection.doc(chatId).get();
  if (pendingSnap.exists) {
    return sendMessage(chatId, "Siz allaqachon ro‘yxatdan o‘tibsiz. Admin tasdig‘ini kuting.");
  }

  userStates[chatId] = { step: "ask_name" };
  await sendMessage(chatId, "Assalomu alaykum! Fayzullaev IELTS School botiga xush kelibsiz!");
  await sendMessage(chatId, "Iltimos, ismingizni kiriting:");
});

// --- CALLBACK QUERY: guruh tanlash (pendingga yozish) ---
bot.on("callback_query", async (query) => {
  const chatId = String(query.message.chat.id);
  const state = userStates[chatId];
  if (!state) return bot.answerCallbackQuery(query.id);

  try {
    const groupId = query.data;
    const groupDoc = await groupsCollection.doc(groupId).get();
    const groupName = groupDoc.data()?.name || "Unknown";

    if (state.step === "ask_group") {
      state.selectedGroupId = groupId;

      // 🔹 NEW LOGIC: pendingCollection ga yoziladi
      await pendingCollection.doc(chatId).set({
        telegramId: chatId,
        firstName: state.name,
        lastName: state.surname,
        phone: state.phone,
        selectedGroupId: groupId,
        status: "pending", // pending holat
        createdAt: new Date()
      });

      await sendMessage(chatId, `Rahmat, ${state.name} ${state.surname}! Siz guruhga tanladingiz: ${groupName}. Admin tasdig‘ini kuting.`);
      delete userStates[chatId];
    }

    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error(err);
    sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// --- MESSAGE HANDLER: foydalanuvchi ma'lumotlarini olish ---
bot.on("message", async (msg) => {
  const chatId = String(msg.chat.id);
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
    }
  } catch (err) {
    console.error(err);
    sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

// 🔹 --- NEW ADMIN LOGIC: pending userlarni approve/reject qilish ---
// Admin panel backend orqali ishlaydi: Allow => usersCollection ga ko‘chiriladi, pendingCollection dan o‘chiriladi
async function approveUser(chatId) {
  const pendingSnap = await pendingCollection.doc(chatId).get();
  if (!pendingSnap.exists) return;

  const data = pendingSnap.data();
  await usersCollection.doc(chatId).set({
    telegramId: data.telegramId,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    groupId: data.selectedGroupId,
    role: "moderator",
    createdAt: data.createdAt
  });

  await pendingCollection.doc(chatId).delete();
  await sendMessage(chatId, "Siz admin tomonidan tasdiqlandingiz va guruhga qo‘shildingiz!");
}

async function rejectUser(chatId) {
  const pendingSnap = await pendingCollection.doc(chatId).get();
  if (!pendingSnap.exists) return;

  await pendingCollection.doc(chatId).delete();
  await sendMessage(chatId, "Siz admin tomonidan rad qilindingiz. Qayta ro‘yxatdan o‘tish uchun /start ni bosing.");
}

module.exports = { bot, approveUser, rejectUser };
