import { useState } from "react";
import { Volume2 } from "lucide-react";
import { unlockAudio, isAudioUnlocked } from "@/lib/audioEngine";
import { requestNotificationPermission } from "@/lib/notifications";

interface UnlockButtonProps {
  onUnlocked?: () => void;
}

export function UnlockButton({ onUnlocked }: UnlockButtonProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (unlocked || isAudioUnlocked()) {
      setUnlocked(true);
      onUnlocked?.();
      return;
    }
    setLoading(true);
    try {
      await requestNotificationPermission();
      const ok = await unlockAudio();
      setUnlocked(ok);
      if (ok) onUnlocked?.();
    } finally {
      setLoading(false);
    }
  };

  if (unlocked || isAudioUnlocked()) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-amber-500/20 border-2 border-amber-500/60 text-amber-400 font-semibold hover:bg-amber-500/30 transition-colors"
    >
      <Volume2 className="w-5 h-5" />
      {loading ? "Активация…" : "Включить звук и уведомления"}
    </button>
  );
}
