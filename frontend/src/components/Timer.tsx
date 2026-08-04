import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  initialSeconds?: number;
  onTick?: (elapsed: number) => void;
  isCountUp?: boolean;
}

export const Timer: React.FC<TimerProps> = ({ initialSeconds = 0, onTick, isCountUp = true }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        const next = isCountUp ? prev + 1 : Math.max(0, prev - 1);
        if (onTick) onTick(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountUp, onTick]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="inline-flex items-center gap-2 bg-slate-900 text-amber-400 font-mono font-bold px-4 py-2 rounded-lg border border-slate-800 shadow-inner">
      <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
      <span className="text-lg tracking-widest">{formatTime(seconds)}</span>
    </div>
  );
};
