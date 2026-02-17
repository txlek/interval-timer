export const sayRemainingTime = (minutes: number) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Отменяем текущую речь, если она идет, чтобы не было очереди
  window.speechSynthesis.cancel();

  const text = `Осталось ${minutes} ${getMinuteDeclension(minutes)}`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 0.9; // Чуть медленнее для четкости
  window.speechSynthesis.speak(utterance);
};

// Функция для правильного склонения: "1 минута", "2 минуты", "5 минут"
function getMinuteDeclension(n: number) {
  const absN = Math.abs(n) % 100;
  const n1 = absN % 10;
  if (absN > 10 && absN < 20) return "минут";
  if (n1 > 1 && n1 < 5) return "минуты";
  if (n1 === 1) return "минута";
  return "минут";
}