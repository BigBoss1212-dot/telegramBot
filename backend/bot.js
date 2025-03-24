const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let userData = {};

// Start Command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userData[chatId] = {}; // Reset user data

    bot.sendMessage(chatId, "🚤 Welcome! Please enter your details:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Enter First Name", callback_data: "first_name" }],
                [{ text: "Enter Last Name", callback_data: "last_name" }],
                [{ text: "Enter Email", callback_data: "email" }],
                [{ text: "✅ Submit", callback_data: "submit" }],
            ],
        },
    });
});

// Handle Button Clicks
bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    if (action === "first_name") {
        bot.sendMessage(chatId, "✏️ Enter your first name:");
        userData[chatId].state = "FIRST_NAME";
    } else if (action === "last_name") {
        bot.sendMessage(chatId, "✏️ Enter your last name:");
        userData[chatId].state = "LAST_NAME";
    } else if (action === "email") {
        bot.sendMessage(chatId, "📧 Enter your email:");
        userData[chatId].state = "EMAIL";
    } else if (action === "submit") {
        if (userData[chatId].firstName && userData[chatId].lastName && userData[chatId].email && userData[chatId].image) {
            // Send data to backend
            await axios.post("http://localhost:5000/api/users", userData[chatId]);

            bot.sendMessage(chatId, "✅ Your data has been submitted successfully!");
            delete userData[chatId]; // Clear user data
        } else {
            bot.sendMessage(chatId, "⚠️ Please fill all fields and upload an image before submitting.");
        }
    }
});

// Capture User Input
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!userData[chatId]) return;

    if (userData[chatId].state === "FIRST_NAME") {
        userData[chatId].firstName = text;
        delete userData[chatId].state;
        bot.sendMessage(chatId, "✅ First name saved!");
    } else if (userData[chatId].state === "LAST_NAME") {
        userData[chatId].lastName = text;
        delete userData[chatId].state;
        bot.sendMessage(chatId, "✅ Last name saved!");
    } else if (userData[chatId].state === "EMAIL") {
        if (/\S+@\S+\.\S+/.test(text)) {
            userData[chatId].email = text;
            delete userData[chatId].state;
            bot.sendMessage(chatId, "✅ Email saved!");
        } else {
            bot.sendMessage(chatId, "⚠️ Invalid email. Please try again.");
        }
    }
});

// Handle Image Uploads
bot.on("photo", async (msg) => {
    const chatId = msg.chat.id;

    if (userData[chatId]) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);
        const response = await axios.get(fileLink, { responseType: "arraybuffer" });

        userData[chatId].image = Buffer.from(response.data).toString("base64");
        bot.sendMessage(chatId, "📸 Image received!");
    }
});

console.log("✅ Telegram bot is running...");
