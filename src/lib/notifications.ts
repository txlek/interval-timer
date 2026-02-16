/**
 * Web Notifications API wrapper.
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

export function showNotification(title: string, body: string): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    const n = new Notification(title, {
      body,
      icon: "/vite.svg",
      badge: "/vite.svg",
      tag: "interval-timer",
      renotify: true,
      requireInteraction: false,
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };

    setTimeout(() => n.close(), 5000);
  } catch {
    // Ignore
  }
}

export function notifyInterval(m: number): void {
  showNotification(
    `${m} minutes passed!`,
    `Your timer has reached the ${m}-minute interval.`
  );
}

export function notifyFinished(): void {
  showNotification("Time's up!", "Your timer has completed.");
}
