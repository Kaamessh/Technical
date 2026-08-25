import React from 'react';
import { useSlotTimer } from '../context/SlotTimerContext';
import { Clock } from 'lucide-react';

interface TimerProps {
  initialSeconds?: number;
  onTick?: (elapsed: number) => void;
  isCountUp?: boolean;
  isActive?: boolean;
}

export const Timer: React.FC<TimerProps> = () => {
  const { formattedTime, remainingSeconds, isStarted } = useSlotTimer();

  // Color dynamics:
  // > 5m: Amber/Emerald
  // 2m - 5m: Amber
  // < 2m: Rose with pulse
  const isUrgent = remainingSeconds <= 120 && isStarted;
  const isWarning = remainingSeconds <= 300 && remainingSeconds > 120 && isStarted;

  return (
    <div
      className={`inline-flex items-center gap-2.5 font-mono font-black px-4 py-2 rounded-xl border shadow-xs transition-all ${
        isUrgent
          ? 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse ring-2 ring-rose-500/50'
          : isWarning
          ? 'bg-amber-950/90 text-amber-300 border-amber-500'
          : 'bg-slate-900 text-amber-400 border-slate-800'
      }`}
      title="Slot 20-Minute Total Time Limit"
    >
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-400 animate-spin' : 'text-amber-400 animate-pulse'}`} />
      <div className="flex flex-col items-start leading-none">
        <span className="text-xs uppercase font-sans font-extrabold tracking-wider text-slate-400 text-[9px] mb-0.5">
          Time Limit (20m)
        </span>
        <span className="text-base tracking-widest">{formattedTime}</span>
      </div>
    </div>
  );
};
