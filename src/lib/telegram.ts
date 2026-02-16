export const triggerTelegramAlert = async (message: string) => {
  const tg = (window as any).Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id;

  if (!userId) return;

  await fetch('https://interval-timer-gagv.onrender.com/api/alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId: userId, message })
  });
};
