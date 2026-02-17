import { useState, useCallback, useEffect } from "react";
import { CircularProgress } from "@/components/CircularProgress";
import { TimerControls } from "@/components/TimerControls";
import { AudioUploadZone } from "@/components/AudioUploadZone";
import { UnlockButton } from "@/components/UnlockButton";
import { useTimer } from "@/hooks/useTimer";

function App() {
  // 1. Состояние для ТЕКСТА в полях (позволяет стирать цифры)
  const [nStr, setNStr] = useState("15");
  const [mStr, setMStr] = useState("2");

  // 2. Состояние для ЧИСЕЛ (то, что понимает таймер)
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

  // Синхронизируем текст с числами только когда введены валидные данные
  useEffect(() => {
    const val = parseInt(nStr);
    if (!isNaN(val) && val > 0) setN(val);
  }, [nStr]);

  useEffect(() => {
    const val = parseInt(mStr);
    if (!isNaN(val) && val > 0) setM(val);
  }, [mStr]);

  const handleResetAudio = useCallback(() => {}, []);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col items-center py-6 px-4 bg-slate-900">
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
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Всего (мин)</label>
              <input
                type="text"
                inputMode="numeric"
                value={nStr}
                onChange={(e) => setNStr(e.target.value)}
                onBlur={() => { if (!nStr || parseInt(nStr) < 1) setNStr("1"); }}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white text-center outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Интервал (мин)</label>
              <input
                type="text"
                inputMode="numeric"
                value={mStr}
                onChange={(e) => setMStr(e.target.value)}
                onBlur={() => { if (!mStr || parseInt(mStr) < 1) setMStr("1"); }}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white text-center outline-none focus:border-blue-500"
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