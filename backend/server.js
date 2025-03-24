const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const cors = require('cors');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Initialize Telegram Bot
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// User Data Storage
let userData = {};

// Load existing data from Excel if available
const filePath = "Users.xlsx";
if (fs.existsSync(filePath)) {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    data.forEach(user => {
        userData[user.chatId] = user;
    });
}

// Save Data to Excel
const saveToExcel = () => {
    const data = Object.values(userData);
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Users");
    xlsx.writeFile(workbook, filePath);
};

// Telegram Bot Commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userData[chatId] = { chatId }; // Initialize user data

    bot.sendMessage(chatId, "🚀 Welcome! Please enter your details:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Enter First Name", callback_data: "first_name" }],
                [{ text: "Enter Last Name", callback_data: "last_name" }],
                [{ text: "Enter Corporate Email", callback_data: "email" }],
                [{ text: "Upload Image", callback_data: "upload_image" }],
                [{ text: "✅ Submit", callback_data: "submit" }]
            ]
        }
    });
});

// Handle button clicks
bot.on("callback_query", (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    if (action === "first_name") {
        bot.sendMessage(chatId, "✏️ Please enter your first name:");
        userData[chatId].state = "FIRST_NAME";
    } else if (action === "last_name") {
        bot.sendMessage(chatId, "✏️ Please enter your last name:");
        userData[chatId].state = "LAST_NAME";
    } else if (action === "email") {
        bot.sendMessage(chatId, "📧 Please enter your email:");
        userData[chatId].state = "EMAIL";
    } else if (action === "upload_image") {
        bot.sendMessage(chatId, "📷 Please upload your image.");
        userData[chatId].state = "UPLOAD_IMAGE";
    } else if (action === "submit") {
        if (userData[chatId].firstName && userData[chatId].lastName && userData[chatId].email && userData[chatId].imageUrl) {
            saveToExcel();
            bot.sendMessage(chatId, "✅ Submission complete! Your data has been saved.");
        } else {
            bot.sendMessage(chatId, "⚠️ Please fill in all fields and upload an image before submitting.");
        }
    }
});

// Handle user text input
bot.on("message", async (msg) => {
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

// Handle image uploads
bot.on("photo", async (msg) => {
    const chatId = msg.chat.id;

    if (userData[chatId] && userData[chatId].state === "UPLOAD_IMAGE") {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);
        userData[chatId].imageUrl = fileLink;
        delete userData[chatId].state;

        bot.sendMessage(chatId, "✅ Image uploaded successfully!");
    }
});

// API to get users
app.get('/api/users', (req, res) => {
    res.json(Object.values(userData));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
