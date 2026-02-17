import { Express } from "express";

// Берем токен из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;

async function sendAlert(chatId: string | number, text: string) {
  if (!BOT_TOKEN) {
    console.error("Ошибка: BOT_TOKEN не найден в process.env");
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: text,
        parse_mode: "HTML" 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Telegram API Error:", error);
    } else {
      console.log(`Уведомление отправлено в чат ${chatId}`);
    }
  } catch (err) {
    console.error("Ошибка сети при отправке в TG:", err);
  }
}

// Экспортируем функцию, которая "регистрирует" маршруты в приложении
export function registerRoutes(app: Express) {
  app.post("/api/alert", async (req, res) => {
    // Получаем и сообщение, и ID чата прямо из тела запроса (с фронтенда)
    const { chatId, message } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({ error: "Не указан chatId или message" });
    }

    try {
      await sendAlert(chatId, message);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ error: "Ошибка при отправке уведомления" });
    }
  });
}