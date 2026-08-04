import React from 'react';
import { Award, Zap } from 'lucide-react';

interface PointsBadgeProps {
  points: number;
  label?: string;
}

export const PointsBadge: React.FC<PointsBadgeProps> = ({ points, label = 'Points' }) => {
  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold px-4 py-2 rounded-xl shadow-md shadow-amber-200">
      <Zap className="w-5 h-5 fill-current text-white animate-bounce" />
      <span className="font-mono text-xl">{points}</span>
      <span className="text-xs uppercase tracking-wider font-semibold opacity-90">{label}</span>
    </div>
  );
};
