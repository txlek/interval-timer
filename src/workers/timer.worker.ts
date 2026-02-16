/**
 * Web Worker for accurate countdown timer.
 * Ensures precision on iOS/Android when screen is locked or tab is in background.
 */

export type TimerMessage =
  | { type: "start"; totalSeconds: number; intervalSeconds: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "reset" }
  | { type: "stop" };

export type TimerResponse =
  | { type: "tick"; remainingSeconds: number; totalSeconds: number }
  | { type: "interval"; remainingSeconds: number; intervalMinutes?: number }
  | { type: "finished"; totalMinutes?: number; intervalMinutes?: number }
  | { type: "stopped" };

let intervalId: ReturnType<typeof setInterval> | null = null;
let remainingSeconds = 0;
let totalSeconds = 0;
let intervalSeconds = 0;
let isPaused = false;
let startTime: number = 0;
let pausedAt: number = 0;

const intervalMarks = new Set<number>();

function scheduleNextTick() {
  if (intervalId) clearInterval(intervalId);
  if (remainingSeconds <= 0) return;

  const now = Date.now();
  const targetTime = startTime + (totalSeconds - remainingSeconds) * 1000;
  const delay = Math.max(0, targetTime - now);

  intervalId = setTimeout(() => {
    tick();
    if (remainingSeconds > 0 && !isPaused) {
      scheduleNextTick();
    }
  }, Math.min(delay, 1000));
}

function tick() {
  if (isPaused) return;

  remainingSeconds--;

  const response: TimerResponse = {
    type: "tick",
    remainingSeconds,
    totalSeconds,
  };
  self.postMessage(response);

  if (intervalMarks.has(remainingSeconds)) {
    self.postMessage({ type: "interval", remainingSeconds } as TimerResponse);
  }

  if (remainingSeconds <= 0) {
    self.postMessage({ type: "finished" } as TimerResponse);
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
}

self.onmessage = (e: MessageEvent<TimerMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case "start":
      if (intervalId) clearInterval(intervalId);
      totalSeconds = msg.totalSeconds;
      remainingSeconds = msg.totalSeconds;
      intervalSeconds = msg.intervalSeconds;
      isPaused = false;
      startTime = Date.now();

      intervalMarks.clear();
      for (let s = totalSeconds - intervalSeconds; s > 0; s -= intervalSeconds) {
        intervalMarks.add(s);
      }
      intervalMarks.add(0);

      scheduleNextTick();
      break;

    case "pause":
      isPaused = true;
      pausedAt = remainingSeconds;
      if (intervalId) {
        clearTimeout(intervalId);
        intervalId = null;
      }
      break;

    case "resume":
      if (!isPaused) break;
      isPaused = false;
      startTime = Date.now() - (totalSeconds - remainingSeconds) * 1000;
      scheduleNextTick();
      break;

    case "reset":
    case "stop":
      if (intervalId) {
        clearTimeout(intervalId);
        intervalId = null;
      }
      self.postMessage({ type: "stopped" } as TimerResponse);
      break;
  }
};
