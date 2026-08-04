import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { supabaseRealtime } from '../../lib/supabaseRealtime';
import { LeaderboardTable, LeaderboardEntry } from '../../components/LeaderboardTable';
import { Trophy, RefreshCw } from 'lucide-react';

export const TeamLeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [standings, setStandings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStandings = async () => {
    if (!user?.slot_id) return;
    try {
      const res = await apiClient.get(`/leaderboard/slot/${user.slot_id}`);
      setStandings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();

    if (!user?.slot_id) return;

    const channel = supabaseRealtime.channel(`slot:${user.slot_id}`);
    channel
      .on('broadcast', { event: 'leaderboard:update' }, () => {
        fetchStandings();
      })
      .subscribe();

    return () => {
      supabaseRealtime.removeChannel(channel);
    };
  }, [user?.slot_id]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500" /> Slot Live Rankings
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time standings for your competitive event slot.</p>
        </div>

        <button onClick={fetchStandings} className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg bg-white border border-slate-200">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading live rankings...</div>
      ) : (
        <LeaderboardTable entries={standings} currentTeamId={user?.id} isAdmin={false} />
      )}
    </div>
  );
};
