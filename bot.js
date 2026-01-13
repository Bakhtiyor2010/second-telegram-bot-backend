require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const User = require("./models/User");

// Botni polling mode bilan ishga tushiramiz
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// User state saqlash uchun
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
    const existingUser = await User.findOne({ telegramId: chatId });
    if (!existingUser) {
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
    const user = await User.findOneAndDelete({ telegramId: chatId });
    if (user) {
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
  if (!state) return; // Agar state bo'lmasa, xabarni e’tiborsiz qoldiramiz

  try {
    // --- Ro‘yxatdan o‘tish ---
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

      const newUser = new User({
        telegramId: chatId,
        name: state.name,
        surname: state.surname,
        phone: state.phone,
      });
      await newUser.save();

      await bot.sendMessage(chatId, `Rahmat, ${state.name} ${state.surname}! Siz ro‘yxatdan o‘tdingiz.`);
      delete userStates[chatId];
    }

    // --- Update step ---
    else if (state.step === "update_name") {
      state.name = text;
      state.step = "update_surname";
      await bot.sendMessage(chatId, "Familiyangizni kiriting:");
    } else if (state.step === "update_surname") {
      state.surname = text;
      state.step = "update_phone";
      await bot.sendMessage(chatId, "Telefon raqamingizni kiriting (masalan +998901234567):");
    } else if (state.step === "update_phone") {
      state.phone = text;

      await User.findOneAndUpdate(
        { telegramId: chatId },
        { name: state.name, surname: state.surname, phone: state.phone },
        { new: true }
      );

      await bot.sendMessage(chatId, `Sizning ma’lumotlaringiz yangilandi: ${state.name} ${state.surname}, ${state.phone}`);
      delete userStates[chatId];
    }

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Server xatosi yuz berdi.");
  }
});

module.exports = bot;