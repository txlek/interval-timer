import { Play, Pause, Square, RotateCcw } from "lucide-react";

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function TimerControls({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
}: TimerControlsProps) {
  if (!isRunning) {
    return (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onStart}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-colors"
        >
          <Play className="w-5 h-5" fill="currentColor" />
          Старт
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {isPaused ? (
        <button
          type="button"
          onClick={onResume}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-colors"
        >
          <Play className="w-5 h-5" fill="currentColor" />
          Продолжить
        </button>
      ) : (
        <button
          type="button"
          onClick={onPause}
          className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold transition-colors"
        >
          <Pause className="w-5 h-5" fill="currentColor" />
          Пауза
        </button>
      )}
      <button
        type="button"
        onClick={onStop}
        className="flex items-center justify-center gap-2 py-4 px-5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold transition-colors"
      >
        <Square className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex items-center justify-center gap-2 py-4 px-5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold transition-colors"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
    </div>
  );
}
