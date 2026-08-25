import React from 'react';
import { useAntiMalpractice } from '../hooks/useAntiMalpractice';
import { ShieldAlert, AlertTriangle, X } from 'lucide-react';

export const MalpracticeWarningBanner: React.FC = () => {
  const { warningAlert, setWarningAlert } = useAntiMalpractice();

  if (!warningAlert) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-300">
      <div className="bg-rose-950/95 text-white border-2 border-rose-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3.5 ring-4 ring-rose-500/20">
        <div className="w-10 h-10 rounded-xl bg-rose-600/30 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-black uppercase tracking-wider text-rose-400">
              Security Flag Detected
            </span>
            <button
              onClick={() => setWarningAlert(null)}
              className="text-rose-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-sm font-bold text-white mt-0.5 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Malpractice Action Prohibited!
          </h4>

          <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
            {warningAlert.message}. This incident has been logged and reported to the event administrator.
          </p>
        </div>
      </div>
    </div>
  );
};
