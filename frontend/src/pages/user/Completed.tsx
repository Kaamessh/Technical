import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Trophy, Award, CheckCircle2, ArrowRight, Zap } from 'lucide-react';

export const EventCompleted: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <ConfettiEffect />
      <div className="card max-w-lg w-full p-8 shadow-2xl border-emerald-100 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-200">
          <Trophy className="w-10 h-10 animate-bounce" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            EVENT COMPLETED 🏆
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-3">VICTORY UNLOCKED!</h1>
          <p className="text-xs text-slate-500 mt-2">
            Congratulations <span className="font-bold text-slate-900">{user?.name}</span>! Your team has successfully conquered all 5 rounds of the competitive event arena.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs font-medium">
          <div className="flex items-center justify-between text-slate-700">
            <span>Round 1: Live Quiz</span>
            <span className="font-bold text-emerald-600 font-mono">COMPLETED ✓</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Round 2: Workflow Sequence</span>
            <span className="font-bold text-emerald-600 font-mono">COMPLETED ✓</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Round 3: AI vs Real Detection</span>
            <span className="font-bold text-emerald-600 font-mono">COMPLETED ✓</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Round 4: Spot the Data Anomaly</span>
            <span className="font-bold text-emerald-600 font-mono">COMPLETED ✓</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Round 5: Final Binary Password</span>
            <span className="font-bold text-emerald-600 font-mono">UNLOCKED ✓</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link to="/team/leaderboard" className="btn-primary flex-1 py-3 justify-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> View Live Leaderboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
