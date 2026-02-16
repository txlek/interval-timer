import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/alert", async (req, res) => {
  const { message } = req.body || {};
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }
  if (!token || !chatId) {
    console.warn("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set");
    return res.status(503).json({ error: "Telegram not configured" });
  }

  try {
    const r = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      }
    );
    if (!r.ok) throw new Error(await r.text());
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
