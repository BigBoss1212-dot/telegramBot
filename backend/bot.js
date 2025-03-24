const TelegramBot = require('node-telegram-bot-api');
const XLSX = require('xlsx');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let userData = {};

// Function to save data to Excel
const saveToExcel = (data) => {
    const filePath = "Users.xlsx";

    let workbook;
    try {
        workbook = XLSX.readFile(filePath);
    } catch (err) {
        workbook = XLSX.utils.book_new();
    }

    let worksheet = workbook.Sheets["Users"] || XLSX.utils.aoa_to_sheet([["First Name", "Last Name", "Email","Payment Method", "Image ID"]]);

    const newRow = [data.FirstName, data.LastName, data.Email, data.PaymentMethod, data.ImageID];

    // Append new row
    const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    sheetData.push(newRow);

    // Convert back to worksheet
    const updatedWorksheet = XLSX.utils.aoa_to_sheet(sheetData);
    workbook.Sheets["Users"] = updatedWorksheet;

    XLSX.writeFile(workbook, filePath);
};

// Handle "/start" command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userData[chatId] = {}; // Initialize user data

    bot.sendMessage(chatId, "🚤 Welcome! Please enter your information details:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Enter First Name", callback_data: "first_name" }],
                [{ text: "Enter Last Name", callback_data: "last_name" }],
                [{ text: "Enter Corporate Email", callback_data: "email" }],
                [{ text: "Enter your Payment Method", callback_data: "paymentMethod"}],
                [{ text: "Please upload the payment checkable Image" , callback_data: "checkImage"}],
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
        bot.sendMessage(chatId, "Please Enter Your Payment Method. You can use just BTC, ETH, USDT, USDC :");
        userData[chatId].state = "PAYMENT_METHOD";
    }
    else if (action === "checkImage") {
        bot.sendMessage(chatId, "📷 Please upload the image you want to check.");
        userData[chatId].state = "CHECK_IMAGE";
    } else if (action === "submit") {
        console.log(`🔍 Checking submission for user ${chatId}:`, userData[chatId]); // Debugging log

        if (
            userData[chatId].firstName &&
            userData[chatId].lastName &&
            userData[chatId].email &&
            userData[chatId].checkImage // Ensure image is uploaded
        ) {
            saveToExcel({
                FirstName: userData[chatId].firstName,
                LastName: userData[chatId].lastName,
                Email: userData[chatId].email,
                PaymentMethod : userData[chatId].paymentMethod,
                ImageID: userData[chatId].checkImage
            });

            bot.sendMessage(chatId, "✅ Your data has been saved successfully in Excel!");
        } else {
            bot.sendMessage(chatId, "⚠️ Please fill in all fields and upload an image before submitting.");
        }
    }
});

// Capture user text input
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!userData[chatId]) return; // Ignore if user hasn't started

    if (userData[chatId].state === "FIRST_NAME") {
        userData[chatId].firstName = text;
        delete userData[chatId].state;
        bot.sendMessage(chatId, "✅ First name saved! Now click the next field to continue.");
    } else if (userData[chatId].state === "LAST_NAME") {
        userData[chatId].lastName = text;
        delete userData[chatId].state;
        bot.sendMessage(chatId, "✅ Last name saved! Now click the next field to continue.");
    } else if (userData[chatId].state === "EMAIL") {
        console.log(userData[chatId].email, text)
        if (/\S+@\S+\.\S+/.test(text)) { // Simple email validation
            userData[chatId].email = text;
            delete userData[chatId].state;
            bot.sendMessage(chatId, "✅ Email saved! Now click the next field to continue.");
        } else {
            bot.sendMessage(chatId, "⚠️ Invalid email. Please enter a valid email address.");
        }
    } else if(userData[chatId].state === "PAYMENT_METHOD"){
        if (text === "BTC" || text === "ETH" || text === "USDT" || text === "USDC"){
            userData[chatId].paymentMethod = text;
            delete userData[chatId].state;
            bot.sendMessage(chatId, "✅ Payment Method saved! Now click the next field to continue.")
        } else {
            bot.sendMessage(chatId, "⚠️ Invalid Payment Method. Please enter a valid Payment Method.")
        }
    }
});

// Handle image uploads
bot.on("photo", (msg) => {
    const chatId = msg.chat.id;

    if (userData[chatId] && userData[chatId].state === "CHECK_IMAGE") {
        const fileId = msg.photo[msg.photo.length - 1].file_id; // Get highest resolution image
        userData[chatId].checkImage = fileId;

        console.log(`✅ Image saved for user ${chatId}:`, fileId); // Debugging log

        bot.sendMessage(chatId, "📸 Image received! Now click submit to save your data.");
        delete userData[chatId].state;
    }
});
