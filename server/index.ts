import express from "express";

const app = express();
app.use(express.json());

app.post("/api/webhook", (req, res) => {
  console.log("Сообщение от Telegram:", req.body);
  res.sendStatus(200);
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});