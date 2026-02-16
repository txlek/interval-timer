import { useMemo } from "react";

interface CircularProgressProps {
  totalSeconds: number;
  remainingSeconds: number;
  intervalMinutes: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({
  totalSeconds,
  remainingSeconds,
  intervalMinutes,
  size = 280,
  strokeWidth = 12,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * circumference : 0;

  const intervalMarks = useMemo(() => {
    const marks: number[] = [];
    const intervalSeconds = intervalMinutes * 60;
    for (let s = totalSeconds - intervalSeconds; s > 0; s -= intervalSeconds) {
      marks.push(s);
    }
    marks.push(0);
    return marks;
  }, [totalSeconds, intervalMinutes]);

  const markAngles = useMemo(() => {
    return intervalMarks.map((s) => {
      const p = totalSeconds > 0 ? s / totalSeconds : 0;
      return -90 + p * 360;
    });
  }, [intervalMarks, totalSeconds]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(71, 85, 105, 0.4)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className="transition-all duration-300 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
      </svg>

      {markAngles.map((angle, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-sky-400/80 ring-2 ring-slate-900"
          style={{
            left: size / 2 + radius * Math.cos((angle * Math.PI) / 180) - 4,
            top: size / 2 + radius * Math.sin((angle * Math.PI) / 180) - 4,
          }}
        />
      ))}

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tabular-nums text-white tracking-tight">
          {formatTime(remainingSeconds)}
        </span>
        <span className="text-slate-400 text-sm mt-1">remaining</span>
      </div>
    </div>
  );
}
