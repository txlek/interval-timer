import { useEffect, useRef, useState, useCallback } from "react";
import type { TimerMessage, TimerResponse } from "@/workers/timer.worker";
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
        const intervalMarks = new Set();
        let intervalId = null;
        let remainingSeconds = 0;
        let totalSeconds = 0;
        let intervalSeconds = 0;
        let isPaused = false;
        let startTime = 0;

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
            self.postMessage({ type: "interval", remainingSeconds, intervalMinutes: Math.round(intervalSeconds/60) });
          }
          if (remainingSeconds <= 0) {
            self.postMessage({ type: "finished", totalMinutes: Math.round(totalSeconds/60), intervalMinutes: Math.round(intervalSeconds/60) });
            if (intervalId) { clearTimeout(intervalId); intervalId = null; }
          }
        }

        self.onmessage = (e) => {
          const msg = e.data;
          switch (msg.type) {
            case "start":
              if (intervalId) clearTimeout(intervalId);
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
              if (intervalId) { clearTimeout(intervalId); intervalId = null; }
              break;
            case "resume":
              if (!isPaused) break;
              isPaused = false;
              startTime = Date.now() - (totalSeconds - remainingSeconds) * 1000;
              scheduleNextTick();
              break;
            case "reset":
            case "stop":
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
          const intervalMin = d.intervalMinutes ?? m;
          unlockAudio().then(() => {
            playIntervalSound(intervalVolRef.current);
          });
          notifyInterval(intervalMin);
          triggerTelegramAlert(`Прошло еще ${intervalMin} мин! Не отвлекайся.`);
          break;
        }
        case "finished":
          unlockAudio().then(() => {
            playFinishSound(finishVolRef.current);
          });
          notifyFinished();
          triggerTelegramAlert(`🏁 Таймер завершен! Пора отдохнуть.`);
          setState((s) => ({ ...s, remainingSeconds: 0, isRunning: false, isPaused: false }));
          break;
        case "stopped":
          setState((s) => ({ ...s, isRunning: false, isPaused: false }));
          break;
      }
    };
    worker.addEventListener("message", handler);
    return () => {
      worker.removeEventListener("message", handler);
      worker.terminate();
      workerRef.current = null;
    };
  }, [n, m]);

  const start = useCallback(async () => {
    await requestNotificationPermission();
    await unlockAudio();
    const total = n * 60;
    const interval = m * 60;
    setState((s) => ({
      ...s,
      remainingSeconds: total,
      totalSeconds: total,
      intervalSeconds: interval,
      isRunning: true,
      isPaused: false,
    }));
    workerRef.current?.postMessage({
      type: "start",
      totalSeconds: total,
      intervalSeconds: interval,
    } as TimerMessage);
  }, [n, m]);

  const pause = useCallback(() => {
    workerRef.current?.postMessage({ type: "pause" } as TimerMessage);
    setState((s) => ({ ...s, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    workerRef.current?.postMessage({ type: "resume" } as TimerMessage);
    setState((s) => ({ ...s, isPaused: false }));
  }, []);

  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: "stop" } as TimerMessage);
    setState((s) => ({
      ...s,
      remainingSeconds: n * 60,
      totalSeconds: n * 60,
      isRunning: false,
      isPaused: false,
    }));
  }, [n]);

  const reset = useCallback(() => {
    workerRef.current?.postMessage({ type: "reset" } as TimerMessage);
    const total = n * 60;
    setState({
      remainingSeconds: total,
      totalSeconds: total,
      intervalSeconds: m * 60,
      isRunning: false,
      isPaused: false,
    });
  }, [n, m]);

  useEffect(() => {
    const total = n * 60;
    const interval = m * 60;
    setState((s) => {
      if (!s.isRunning) {
        return { ...s, remainingSeconds: total, totalSeconds: total, intervalSeconds: interval };
      }
      return s;
    });
  }, [n, m]);

  return { state, start, pause, resume, stop, reset };
}
