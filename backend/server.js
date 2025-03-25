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


const readUsersFromExcel = () => {
    if (!fs.existsSync(filePath)) return [];
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
};

// Function to save users to Excel
//     const data = Object.values(userData);
const saveToExcel = (users) => {
    const workbook = xlsx.utils.book_new();
    const data = Object.values(userData);
    const sheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, sheet, "Users");
    xlsx.writeFile(workbook, filePath);
};

// Save Data to Excel
// const saveToExcel = () => {
//     const data = Object.values(userData);
//     const worksheet = xlsx.utils.json_to_sheet(data);
//     const workbook = xlsx.utils.book_new();
//     xlsx.utils.book_append_sheet(workbook, worksheet, "Users");
//     xlsx.writeFile(workbook, filePath);
// };

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
                [{ text: "Enter Payment Method", callback_data: "paymentMethod" }],
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
    } else if (action === "paymentMethod") {
        bot.sendMessage(chatId, "📧 Please enter your payment Method, It is just BTC, ETH, USDT, USDC:");
        userData[chatId].state = "PAYMENTMETHOD";
    }  
    else if (action === "upload_image") {
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
    } else if (userData[chatId].state === "PAYMENTMETHOD") {
        if (text === "BTC" || text === "ETH" || text === "USDT" || text === "USDC") {
            userData[chatId].paymentMethod = text;
            delete userData[chatId].state;
            switch (text) {
                case "BTC":
                    bot.sendMessage(chatId, "✅ Success to set the payment method. Please pay to this Address : 1HGW1oyVKDpnWmMLDUBLAMtL9y6p1QkndS");
                    break;
                case "EHT":
                    bot.sendMessage(chatId, "✅ Success to set the payment method. Please pay to this Address : 0x3ec89673c95acb7bf2d9474cad5f99f01db73635");
                    break;  
                case "USDT":
                    bot.sendMessage(chatId, "✅ Success to set the payment method. Please pay to this Address : 0x3ec89673c95acb7bf2d9474cad5f99f01db73635");
                    break;
                case "USDC":
                    bot.sendMessage(chatId, "✅ Success to set the payment method. Please pay to this Address : 0x3ec89673c95acb7bf2d9474cad5f99f01db73635");
                    break;  
            
                default:
                    break;
            }
        } else {
            bot.sendMessage(chatId, "⚠️ Invalid payment method. Please try again.");
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
    const users = readUsersFromExcel();
    res.json(users);

    // res.json(Object.values(userData));
});

app.get("/user-image/:fileId", async (req, res) => {
    const fileId = req.params.fileId;
    try {
        // Get file path from Telegram API
        const fileResponse = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
        const filePath = fileResponse.data.result.file_path;

        // Return full image URL
        const imageUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
        res.json({ imageUrl });
    } catch (error) {
        console.error("Error fetching image:", error);
        res.status(500).json({ error: "Could not retrieve image" });
    }
});

app.post("/users", (req, res) => {
    const users = readUsersFromExcel(); // Read existing users
    users.push(req.body); // Append new user
    saveToExcel(users); // Save back to file
    res.json({ success: true, message: "User added successfully!" });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
