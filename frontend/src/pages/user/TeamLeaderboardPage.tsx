import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { supabaseRealtime } from '../../lib/supabaseRealtime';
import { LeaderboardTable, LeaderboardEntry } from '../../components/LeaderboardTable';
import { Trophy, Globe, Layers, RefreshCw } from 'lucide-react';

export const TeamLeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [standings, setStandings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'slot' | 'global'>('slot');
  const [slotCode, setSlotCode] = useState<string>('');

  const fetchStandings = async () => {
    if (!user?.slot_id) return;
    setLoading(true);
    try {
      if (viewMode === 'slot') {
        const res = await apiClient.get(`/leaderboard/slot/${user.slot_id}`);
        setStandings(res.data);
      } else {
        const res = await apiClient.get(`/leaderboard/global/${user.event_id || ''}`);
        setStandings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.slot_id) {
      apiClient.get(`/slots/event/${user.event_id || ''}`).then((res) => {
        const mySlot = res.data.find((s: any) => s.id === user.slot_id);
        if (mySlot) setSlotCode(mySlot.slot_code);
      }).catch(() => {});
    }
  }, [user]);

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
  }, [user?.slot_id, viewMode]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            {viewMode === 'slot' ? `SLOT LEADERBOARD — ${slotCode ? `CODE: ${slotCode}` : 'YOUR SLOT'}` : 'GLOBAL EVENT LEADERBOARD'}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500" /> {viewMode === 'slot' ? 'My Slot Live Rankings' : 'Global Arena Standings'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {viewMode === 'slot'
              ? 'Real-time standings for teams in your specific competitive event slot.'
              : 'Overall standings across all competitive slots in the event.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('slot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'slot' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> My Slot
            </button>
            <button
              type="button"
              onClick={() => setViewMode('global')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'global' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Global
            </button>
          </div>

          <button onClick={fetchStandings} className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg bg-white border border-slate-200" title="Refresh Rankings">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading live rankings...</div>
      ) : (
        <LeaderboardTable entries={standings} currentTeamId={user?.id} isAdmin={false} />
      )}
    </div>
  );
};
