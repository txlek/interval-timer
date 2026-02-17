import express from "express";
import cors from "cors";

const app = express();

// Разрешаем запросы (лучше в будущем ограничить до конкретного домена Vercel)
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// 1. Прием сообщений ОТ Телеграма (понадобится, если будешь делать команды типа /start)
app.post("/api/webhook", (req, res) => {
  console.log("Данные от Telegram:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// 2. Отправка сообщений В Телеграм
app.post("/api/alert", async (req, res) => {
  const { chatId, message } = req.body;

  if (!chatId || !message) {
    return res.status(400).send("Missing chatId or message");
  }

  if (!BOT_TOKEN) {
    return res.status(500).send("Server configuration error: Token missing");
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: message,
        parse_mode: "HTML" // Добавил, чтобы ты мог использовать <b>теги</b>
      }),
    });

    if (response.ok) {
      console.log(`Уведомление отправлено для ${chatId}`);
      res.status(200).send("Alert sent!");
    } else {
      const errorDetails = await response.json();
      console.error("TG API Error:", errorDetails);
      res.status(response.status).json(errorDetails);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Простой хелсчек, чтобы видеть, что сервер жив
app.get("/", (req, res) => res.send("Timer Backend is running!"));

const PORT = process.env.PORT || 5000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});