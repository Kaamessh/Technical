import React from 'react';
import { Trophy, Medal, Award, Edit3 } from 'lucide-react';

export interface LeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  slot_code?: string;
  total_points: number;
  highest_round: number;
  latest_completed_at?: string | null;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentTeamId?: string;
  onAdjustPoints?: (teamId: string, teamName: string) => void;
  isAdmin?: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  currentTeamId,
  onAdjustPoints,
  isAdmin = false,
}) => {
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
          <Trophy className="w-4 h-4 text-amber-500" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
          <Medal className="w-4 h-4 text-slate-400" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
          <Award className="w-4 h-4 text-amber-700" />
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center font-semibold text-sm">
        #{rank}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4 w-16 text-center">Rank</th>
              <th className="py-3.5 px-4">Team Name</th>
              {entries.some((e) => e.slot_code) && <th className="py-3.5 px-4">Slot</th>}
              <th className="py-3.5 px-4 text-center">Max Round</th>
              <th className="py-3.5 px-4 text-right">Total Points</th>
              {isAdmin && <th className="py-3.5 px-4 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-slate-400">
                  No teams registered or scored points yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isSelf = currentTeamId === entry.team_id;
                return (
                  <tr
                    key={entry.team_id}
                    className={`transition-colors ${
                      isSelf ? 'bg-indigo-50/80 font-semibold text-indigo-950' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center flex justify-center">
                      {getRankBadge(entry.rank)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{entry.team_name}</span>
                        {isSelf && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-600 text-white uppercase font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    {entry.slot_code && (
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 font-semibold">
                          {entry.slot_code}
                        </span>
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Round {entry.highest_round || 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-extrabold text-base text-indigo-600">
                        {entry.total_points} <span className="text-xs font-sans text-slate-400 font-normal">pts</span>
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onAdjustPoints && onAdjustPoints(entry.team_id, entry.team_name)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                          title="Adjust Points"
                        >
                          <Edit3 className="w-4 h-4" /> Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
