import React, { useEffect, useState, useRef } from 'react';
import { KeyRound, Sparkles, Binary, ArrowRight } from 'lucide-react';

interface DecodePopupProps {
  roundNumber: number;
  pairNumbers: number[] | null;
  binaryClue?: string | null;
  onDismiss: () => void;
}

export const DecodePopup: React.FC<DecodePopupProps> = ({ roundNumber, pairNumbers, binaryClue, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const nextRound = roundNumber + 1;

  useEffect(() => {
    const startTime = Date.now();
    const duration = binaryClue ? 5000 : 3500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        onDismissRef.current();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [binaryClue]);

  if (!pairNumbers || pairNumbers.length < 2) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-emerald-500/20 font-mono relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Countdown Bar */}
        <div
          className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-emerald-400 to-indigo-500 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />

        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-inner">
          <KeyRound className="w-8 h-8 animate-bounce" />
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" /> DECODE CLUE REVEALED — ROUND {roundNumber}
        </div>

        <h3 className="text-xl font-extrabold text-white mb-1 tracking-wide">
          Puzzle Letter Hint #{roundNumber}
        </h3>
        <p className="text-slate-400 text-xs mb-4 font-sans leading-relaxed">
          Memorize or note down your team's letter numbers for the Round 5 final decode!
        </p>

        {/* Big Clue Numbers Display */}
        <div className="flex items-center justify-center gap-4 my-4">
          <div className="w-20 h-20 bg-slate-800/90 border-2 border-emerald-400 rounded-2xl flex items-center justify-center text-3xl font-black text-emerald-400 shadow-inner">
            {pairNumbers[0]}
          </div>
          <span className="text-2xl font-bold text-slate-500">+</span>
          <div className="w-20 h-20 bg-slate-800/90 border-2 border-emerald-400 rounded-2xl flex items-center justify-center text-3xl font-black text-emerald-400 shadow-inner">
            {pairNumbers[1]}
          </div>
        </div>

        {/* Binary Clue (if Round 4 finale) */}
        {binaryClue && (
          <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 my-4 animate-pulse">
            <div className="text-[11px] font-bold text-amber-400 flex items-center justify-center gap-1.5 mb-1 font-sans">
              <Binary className="w-4 h-4" /> UNIQUE BINARY UNLOCK CODE
            </div>
            <div className="text-2xl font-black text-amber-300 tracking-widest font-mono">
              {binaryClue}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => onDismissRef.current()}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <span>Proceed to Round {nextRound}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-[11px] text-slate-500 font-sans">
            Auto-proceeding in <span className="font-mono text-emerald-400 font-bold">{Math.ceil((progress / 100) * (binaryClue ? 5 : 3.5))}s</span>...
          </div>
        </div>
      </div>
    </div>
  );
};
