import { useEffect, useRef, useState, useCallback } from "react";
// Если какие-то пути подсвечены красным - не страшно, главное чтобы сами файлы существовали
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

// Эта функция должна быть ВНЕ хука useTimer
function getMinuteDeclension(n: number): string {
  const absN = Math.abs(n) % 100;
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
  
  // Обновляем рефы при изменении громкости
  intervalVolRef.current = intervalVolume;
  finishVolRef.current = finishVolume;

  useEffect(() => {
    // ВЕСЬ КОД ВОРКЕРА В ОДНОЙ СТРОКЕ (безопасно для копирования)
    // Мы используем обычную строку, чтобы избежать конфликтов с кавычками
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
        self.postMessage({ type: "tick", remainingSeconds: remainingSeconds });
        
        if (intervalMarks.has(remainingSeconds)) {
          self.postMessage({ type: "interval", remainingSeconds: remainingSeconds });
        }
        
        if (remainingSeconds <= 0) {
          self.postMessage({ type: "finished" });
          clearInterval(intervalId);
        }
      }

      self.onmessage = function(e) {
        const msg = e.data;
        if (msg.type === "start") {
          remainingSeconds = msg.totalSeconds;
          totalSeconds = msg.totalSeconds;
          intervalSeconds = msg.intervalSeconds;
          isPaused = false;
          intervalMarks.clear();
          // Рассчитываем точки срабатывания
          for (let s = totalSeconds - intervalSeconds; s > 0; s -= intervalSeconds) {
            intervalMarks.add(s);
          }
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(tick, 1000);
        } 
        else if (msg.type === "pause") {
          isPaused = true;
        } 
        else if (msg.type === "resume") {
          isPaused = false;
        } 
        else if (msg.type === "stop" || msg.type === "reset") {
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
      } 
      else if (d.type === "interval") {
        const remMin = Math.round(d.remainingSeconds / 60);
        
        unlockAudio().then(() => {
          playIntervalSound(intervalVolRef.current);
          
          if (remMin > 0 && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            // Склеиваем строку текста
            const text = "Осталось " + remMin + " " + getMinuteDeclension(remMin);
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'ru-RU';
            msg.rate = 1.0; 
            window.speechSynthesis.speak(msg);
          }
        });
        
        notifyInterval(remMin);
        triggerTelegramAlert("Осталось " + remMin + " мин!");
      } 
      else if (d.type === "finished") {
        unlockAudio().then(() => playFinishSound(finishVolRef.current));
        notifyFinished();
        triggerTelegramAlert("🏁 Таймер завершен!");
        setState(s => ({ ...s, isRunning: false, remainingSeconds: 0 }));
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const start = useCallback(async () => {
    await requestNotificationPermission();
    await unlockAudio();
    
    // "Пинок" для iOS аудио
    if ('speechSynthesis' in window) {
       const dummy = new SpeechSynthesisUtterance("");
       dummy.volume = 0;
       window.speechSynthesis.speak(dummy);
    }

    const total = n * 60;
    const interval = m * 60;
    
    setState(s => ({ 
      ...s, 
      isRunning: true, 
      isPaused: false, 
      remainingSeconds: total,
      totalSeconds: total,
      intervalSeconds: interval
    }));
    
    workerRef.current?.postMessage({ 
      type: "start", 
      totalSeconds: total, 
      intervalSeconds: interval 
    });
  }, [n, m]);

  const pause = useCallback(() => {
    workerRef.current?.postMessage({ type: "pause" });
    setState(s => ({ ...s, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    workerRef.current?.postMessage({ type: "resume" });
    setState(s => ({ ...s, isPaused: false }));
  }, []);

  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: "stop" });
    setState(s => ({ ...s, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    workerRef.current?.postMessage({ type: "reset" });
    setState(s => ({ 
      ...s, 
      isRunning: false, 
      isPaused: false,
      remainingSeconds: n * 60 
    }));
  }, [n]);

  // Синхронизация при изменении инпутов (если таймер стоит)
  useEffect(() => {
    setState(prev => {
      if (!prev.isRunning) {
        return { 
          ...prev, 
          totalSeconds: n * 60,
          remainingSeconds: n * 60,
          intervalSeconds: m * 60
        };
      }
      return prev;
    });
  }, [n, m]);

  return { state, start, pause, resume, stop, reset };
}