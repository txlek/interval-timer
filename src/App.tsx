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

  const { state, start, pause, resume, stop, reset } = useTimer(
    n,
    m,
    intervalVolume,
    finishVolume
  );

  const handleResetAudio = useCallback(() => {
    // Trigger re-render of upload zones if needed
  }, []);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col items-center py-6 px-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Интервальный таймер</h1>
        <p className="text-slate-400 text-sm mt-1">
          Всего: {n} мин • Напоминание каждые: {m} мин
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
              <label className="text-xs text-slate-500 block mb-1">Всего (N) мин</label>
              {/* Инпут для N (Всего) */}
<input
  type="number"
  value={n === 0 ? "" : n} // Если 0, показываем пустую строку
  onChange={(e) => {
    const val = e.target.value;
    if (val === "") {
      setN(0); // Временно ставим 0, чтобы можно было стереть
    } else {
      const num = parseInt(val);
      setN(isNaN(num) ? 0 : num);
    }
  }}
  onBlur={() => { if (n < 1) setN(1); }} // Если ушли из поля, а там пусто — ставим 1
  className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
/>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Интервал (M) мин</label>
              {/* Аналогично для M (Интервал) */}
<input
  type="number"
  value={m === 0 ? "" : m}
  onChange={(e) => {
    const val = e.target.value;
    if (val === "") {
      setM(0);
    } else {
      const num = parseInt(val);
      setM(isNaN(num) ? 0 : num);
    }
  }}
  onBlur={() => { if (m < 1) setM(1); }}
  className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white"
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
          <h2 className="text-sm font-medium text-slate-400">Звуки</h2>
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
