import { useEffect, useRef, useState, useCallback } from "react";
import { TimerResponse } from "@/workers/timer.worker";
import { playIntervalSound, playFinishSound, unlockAudio } from "@/lib/audioEngine";
import { notifyInterval, notifyFinished, requestNotificationPermission } from "@/lib/notifications";
import { triggerTelegramAlert } from "@/lib/telegram";

export interface TimerState {
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  intervalSeconds: number;
}

// Функция склонения (вне хука)
function getMinuteDeclension(n: number) {
  const absN = Math.abs(n) % 100;
  const n1 = absN % 10;
  if (absN > 10 && absN < 20) return "минут";
  if (n1 > 1 && n1 < 5) return "минуты";
  if (n1 === 1) return "минута";
  return "минут";
}

export function useTimer(
  n: number,
  m: number,
  intervalVolume: number,
  finishVolume: number
) {
  const [state, setState] = useState<TimerState>({
    remainingSeconds: n * 60,
    totalSeconds: n * 60,
    isRunning: false,
    isPaused: false,
    intervalSeconds: m * 60,
  });

  const workerRef = useRef<Worker | null>(null);
  const intervalVolRef = useRef(intervalVolume);
  const finishVolRef = useRef(finishVolume);
  
  intervalVolRef.current = intervalVolume;
  finishVolRef.current = finishVolume;

  useEffect(() => {
    const blob = new Blob(
      [`
        let intervalId = null;
        let remainingSeconds = 0;
        let totalSeconds = 0;
        let intervalSeconds = 0;
        let isPaused = false;
        let startTime = 0;
        const intervalMarks = new Set();

        function scheduleNextTick() {
          if (intervalId) clearInterval(intervalId);
          if (remainingSeconds <= 0) return;
          const now = Date.now();
          const targetTime = startTime + (totalSeconds - remainingSeconds) * 1000;
          const delay = Math.max(0, targetTime - now);
          intervalId = setTimeout(() => {
            tick();
            if (remainingSeconds > 0 && !isPaused) scheduleNextTick();
          }, Math.min(delay, 1000));
        }

        function tick() {
          if (isPaused) return;
          remainingSeconds--;
          self.postMessage({ type: "tick", remainingSeconds, totalSeconds });
          if (intervalMarks.has(remainingSeconds)) {
            self.postMessage({ type: "interval", remainingSeconds });
          }
          if (remainingSeconds <= 0) {
            self.postMessage({ type: "finished" });
            if (intervalId) { clearTimeout(intervalId); intervalId = null; }
          }
        }

        self.onmessage = (e) => {
          const msg = e.data;
          switch (msg.type) {
            case "start":
              totalSeconds = msg.totalSeconds;
              remainingSeconds = msg.totalSeconds;
              intervalSeconds = msg.intervalSeconds;
              isPaused = false;
              startTime = Date.now();
              intervalMarks.clear();
              for (let s = totalSeconds - intervalSeconds; s > 0; s -= intervalSeconds) {
                intervalMarks.add(s);
              }
              scheduleNextTick();
              break;
            case "pause": isPaused = true; break;
            case "resume":
              isPaused = false;
              startTime = Date.now() - (totalSeconds - remainingSeconds) * 1000;
              scheduleNextTick();
              break;
            case "stop":
            case "reset":
              if (intervalId) { clearTimeout(intervalId); intervalId = null; }
              self.postMessage({ type: "stopped" });
              break;
          }
        };
      `],
      { type: "application/javascript" }
    );

    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    const handler = (ev: MessageEvent<TimerResponse>) => {
      const d = ev.data;
      switch (d.type) {
        case "tick":
          setState((s) => ({ ...s, remainingSeconds: d.remainingSeconds }));
          break;
        case "interval": {
          const remMin = Math.round(d.remainingSeconds / 60);
          unlockAudio().then(() => {
            playIntervalSound(intervalVolRef.current);
            if (remMin > 0 && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              const text = `Осталось ${remMin} ${getMinuteDeclension(remMin)}`;
              const msg = new SpeechSynthesisUtterance(text);
              msg.lang = 'ru-RU';
              window.speechSynthesis.speak(msg);
            }
          });
          notifyInterval(remMin);
          triggerTelegramAlert(`Осталось ${remMin} мин!`);
          break;
        }
        case "finished":
          unlockAudio().then(() => playFinishSound(finishVolRef.current));
          notifyFinished();
          triggerTelegramAlert("🏁 Таймер завершен!");
          setState((s) => ({ ...s, isRunning: false, remainingSeconds: 0 }));
          break;
        case "stopped":
          setState((s) => ({ ...s, isRunning: false }));
          break;
      }
    };

    worker.addEventListener("message", handler);
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    await requestNotificationPermission();
    await unlockAudio();
    // Пробуждаем голос
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    }

    const total = n * 60;
    const interval = m * 60;
    setState(s => ({ ...s, isRunning: true, isPaused: false, totalSeconds: total, remainingSeconds: total }));
    workerRef.current?.postMessage({ type: "start", totalSeconds: total, intervalSeconds: interval });
  }, [n, m]);

  const pause = () => {
    workerRef.current?.postMessage({ type: "pause" });
    setState(s => ({ ...s, isPaused: true }));
  };

  const resume = () => {
    workerRef.current?.postMessage({ type: "resume" });
    setState(s => ({ ...s, isPaused: false }));
  };

  const stop = () => {
    workerRef.current?.postMessage({ type: "stop" });
    setState(s => ({ ...s, isRunning: false }));
  };

  const reset = () => {
    workerRef.current?.postMessage({ type: "reset" });
    setState(s => ({ ...s, isRunning: false, remainingSeconds: n * 60 }));
  };

  return { state, start, pause, resume, stop, reset };
}