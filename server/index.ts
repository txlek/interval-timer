import express from "express";
import cors from "cors";

const app = express();

// Разрешаем запросы с других доменов (твоего сайта на Vercel)
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8580855158:AAH_6G1sxG8NZYb6Qfv8CGC7CECfDtHfajU";

// 1. Прием сообщений ОТ Телеграма (вебхук)
app.post("/api/webhook", (req, res) => {
  console.log("Данные от Telegram:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});
// 2. Отправка сообщений В Телеграм (вызывается фронтендом)
app.post("/api/alert", async (req, res) => {
  const { chatId, message } = req.body;

  if (!chatId || !message) {
    return res.status(400).send("Missing chatId or message");
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    if (response.ok) {
      res.status(200).send("Alert sent!");
    } else {
      res.status(500).send("Error sending to Telegram API");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Используем порт от хостинга или 5000 для локальных тестов
const PORT = process.env.PORT || 5000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});