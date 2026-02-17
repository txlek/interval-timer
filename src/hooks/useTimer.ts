import { useEffect, useRef, useState, useCallback } from "react";
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

function getMinuteDeclension(n: number): string {
  const absN = Math.max(0, Math.floor(n)) % 100;
  const n1 = absN % 10;
  if (absN > 10 && absN < 20) return "минут";
  if (n1 > 1 && n1 < 5) return "минуты";
  if (n1 === 1) return "минута";
  return "минут";
}

export function useTimer(n: number, m: number, intervalVolume: number, finishVolume: number) {
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
    const workerCode = `
      let intervalId = null;
      let remainingSeconds = 0;
      let totalSeconds = 0;
      let intervalSeconds = 0;
      let isPaused = false;
      const intervalMarks = new Set();

      function tick() {
        if (isPaused) return;
        remainingSeconds--;
        self.postMessage({ type: "tick", remainingSeconds });
        if (intervalMarks.has(remainingSeconds)) {
          self.postMessage({ type: "interval", remainingSeconds });
        }
        if (remainingSeconds <= 0) {
          self.postMessage({ type: "finished" });
          if (intervalId) clearInterval(intervalId);
        }
      }

      self.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === "start") {
          remainingSeconds = msg.totalSeconds;
          totalSeconds = msg.totalSeconds;
          intervalSeconds = msg.intervalSeconds;
          isPaused = false;
          intervalMarks.clear();
          for (let s = totalSeconds - intervalSeconds; s > 0; s -= intervalSeconds) {
            intervalMarks.add(s);
          }
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(tick, 1000);
        } else if (msg.type === "pause") {
          isPaused = true;
        } else if (msg.type === "resume") {
          isPaused = false;
        } else if (msg.type === "stop" || msg.type === "reset") {
          if (intervalId) clearInterval(intervalId);
        }
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    worker.onmessage = (ev) => {
      const d = ev.data;
      if (d.type === "tick") {
        setState(s => ({ ...s, remainingSeconds: d.remainingSeconds }));
      } else if (d.type === "interval") {
        const remMin = Math.round(d.remainingSeconds / 60);
        unlockAudio().then(() => {
          playIntervalSound(intervalVolRef.current);
          if (remMin > 0 && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const text = "Осталось " + remMin + " " + getMinuteDeclension(remMin);
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'ru-RU';
            window.speechSynthesis.speak(msg);
          }
        });
        notifyInterval(remMin);
        triggerTelegramAlert("Осталось " + remMin + " мин!");
      } else if (d.type === "finished") {
        unlockAudio().then(() => playFinishSound(finishVolRef.current));
        notifyFinished();
        triggerTelegramAlert("🏁 Таймер завершен!");
        setState(s => ({ ...s, isRunning: false, remainingSeconds: 0 }));
      }
    };

    return () => worker.terminate();
  }, []);

  const start = useCallback(async () => {
    await requestNotificationPermission();
    await unlockAudio();
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
    setState(s => ({ ...s, isRunning: false, isPaused: false, remainingSeconds: n * 60 }));
  };

  return { state, start, pause, resume, stop, reset };
}