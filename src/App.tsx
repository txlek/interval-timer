import { useState, useCallback } from "react";
import { CircularProgress } from "@/components/CircularProgress";
import { TimerControls } from "@/components/TimerControls";
import { AudioUploadZone } from "@/components/AudioUploadZone";
import { UnlockButton } from "@/components/UnlockButton";
import { useTimer } from "@/hooks/useTimer";

function App() {
  const [n, setN] = useState(15);
  const [m, setM] = useState(2);
  const [intervalVolume, setIntervalVolume] = useState(0.8);
  const [finishVolume, setFinishVolume] = useState(1);

  // Вызываем хук. Важно: порядок аргументов должен совпадать с useTimer.ts
  const { state, start, pause, resume, stop, reset } = useTimer(
    n || 1, 
    m || 1,
    intervalVolume,
    finishVolume
  );

  const handleResetAudio = useCallback(() => {}, []);

  const testVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance("Проверка голоса. Один, два, три.");
      msg.lang = 'ru-RU';
      window.speechSynthesis.speak(msg);
    } else {
      alert("Браузер не поддерживает синтез речи");
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col items-center py-6 px-4 relative">
      
      {/* Кнопка теста */}
      <button 
        onClick={testVoice}
        className="fixed top-2 right-2 z-[9999] bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold shadow-lg active:scale-95"
      >
        🔈 ГОЛОС
      </button>

      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">Таймер</h1>
        <p className="text-slate-400 text-sm mt-1">
          Всего: {n} мин • Интервал: {m} мин
        </p>
      </header>

      <UnlockButton />

      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <CircularProgress
          totalSeconds={state.totalSeconds}
          remainingSeconds={state.remainingSeconds}
          intervalMinutes={m}
        />

        {!state.isRunning && (
          <div className="w-full grid grid-cols-2 gap-3">
            <div>
  <label className="text-xs text-slate-500 block mb-1">Всего (мин)</label>
  <input
    type="number"
    inputMode="numeric" // Помогает телефонам открыть цифровую клавиатуру
    value={n === 0 ? "" : n}
    onChange={(e) => {
      const val = e.target.value;
      // Позволяем полю быть пустым во время редактирования
      if (val === "") {
        setN(0); 
      } else {
        const parsed = parseInt(val);
        if (!isNaN(parsed)) setN(parsed);
      }
    }}
    // Только когда пользователь "ушел" из поля, ставим минимум 1
    onBlur={() => {
      if (n < 1) setN(1);
    }}
    className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white text-center"
  />
</div>

<div>
  <label className="text-xs text-slate-500 block mb-1">Интервал (мин)</label>
  <input
    type="number"
    inputMode="numeric"
    value={m === 0 ? "" : m}
    onChange={(e) => {
      const val = e.target.value;
      if (val === "") {
        setM(0);
      } else {
        const parsed = parseInt(val);
        if (!isNaN(parsed)) setM(parsed);
      }
    }}
    onBlur={() => {
      if (m < 1) setM(1);
    }}
    className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white text-center"
  />
</div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Интервал (мин)</label>
              <input
                type="number"
                value={m === 0 ? "" : m}
                onChange={(e) => setM(e.target.value === "" ? 0 : parseInt(e.target.value))}
                onBlur={() => { if (m < 1) setM(1); }}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white text-center"
              />
            </div>
          </div>
        )}

        <TimerControls
          isRunning={state.isRunning}
          isPaused={state.isPaused}
          onStart={start}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onReset={reset}
        />

        <div className="w-full space-y-4">
          <AudioUploadZone
            type="interval"
            label="Звук интервала"
            volume={intervalVolume}
            onVolumeChange={setIntervalVolume}
            onFileSaved={handleResetAudio}
          />
          <AudioUploadZone
            type="finish"
            label="Звук окончания"
            volume={finishVolume}
            onVolumeChange={setFinishVolume}
            onFileSaved={handleResetAudio}
          />
        </div>
      </div>
    </div>
  );
}

export default App;