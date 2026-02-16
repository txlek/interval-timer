import { useCallback, useState, useEffect } from "react";
import { Volume2, Music, RotateCcw } from "lucide-react";
import { isFormatSupported, playIntervalSound, playFinishSound } from "@/lib/audioEngine";
import {
  saveIntervalSound,
  saveFinishSound,
  resetIntervalSound,
  resetFinishSound,
  hasCustomIntervalSound,
  hasCustomFinishSound,
} from "@/lib/audioEngine";
import { unlockAudio } from "@/lib/audioEngine";

interface AudioUploadZoneProps {
  type: "interval" | "finish";
  label: string;
  volume: number;
  onVolumeChange: (v: number) => void;
  onFileSaved?: () => void;
}

export function AudioUploadZone({
  type,
  label,
  volume,
  onVolumeChange,
  onFileSaved,
}: AudioUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasCustom, setHasCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fn = type === "interval" ? hasCustomIntervalSound : hasCustomFinishSound;
    fn().then(setHasCustom);
  }, [type]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!isFormatSupported(file.name)) {
        setError("Supported: .mp3, .wav, .m4a");
        return;
      }
      try {
        const save = type === "interval" ? saveIntervalSound : saveFinishSound;
        await save(file);
        setHasCustom(true);
        onFileSaved?.();
      } catch {
        setError("Failed to save");
      }
    },
    [type, onFileSaved]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const handleReset = useCallback(async () => {
    const reset = type === "interval" ? resetIntervalSound : resetFinishSound;
    await reset();
    setHasCustom(false);
    setError(null);
    onFileSaved?.();
  }, [type, onFileSaved]);

  const handlePreview = useCallback(async () => {
    await unlockAudio();
    if (type === "interval") playIntervalSound(volume);
    else playFinishSound(volume);
  }, [type, volume]);

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Music className="w-4 h-4 text-sky-400" />
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {hasCustom && (
          <button
            type="button"
            onClick={handleReset}
            className="ml-auto flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
          >
            <RotateCcw className="w-3 h-3" />
            Reset to Default
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors
          ${isDragging ? "border-sky-500 bg-sky-500/10" : "border-slate-600 hover:border-slate-500"}
        `}
        onClick={() => document.getElementById(`file-${type}`)?.click()}
      >
        <input
          id={`file-${type}`}
          type="file"
          accept=".mp3,.wav,.m4a"
          className="hidden"
          onChange={handleInput}
        />
        <p className="text-slate-400 text-sm">
          {hasCustom ? "Custom sound loaded" : "Drop file or click to upload"}
        </p>
        <p className="text-slate-500 text-xs mt-1">.mp3, .wav, .m4a</p>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-slate-500" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
        <button
          type="button"
          onClick={handlePreview}
          className="text-xs text-sky-400 hover:text-sky-300"
        >
          Preview
        </button>
      </div>
    </div>
  );
}
