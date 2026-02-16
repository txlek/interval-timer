export function triggerTelegramAlert(msg: string): void {
  fetch("/api/alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg }),
  }).catch(() => {});
}
