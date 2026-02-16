const BOT_TOKEN = "8580855158:AAH_6G1sxG8NZYb6Qfv8CGC7CECfDtHfajU";

async function sendAlert(text: string) {
  const chatId = "ТВОЙ_ID_КОТОРЫЙ_ТЫ_ЗАПИСАЛ"; 
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
    console.log("Уведомление отправлено в Telegram!");
  } catch (err) {
    console.error("Ошибка отправки:", err);
  }
}

// Создадим путь, который будет вызывать фронтенд
app.post("/api/alert", async (req, res) => {
  const { message } = req.body;
  await sendAlert(message);
  res.sendStatus(200);
});