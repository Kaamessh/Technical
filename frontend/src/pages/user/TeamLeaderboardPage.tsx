import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { supabaseRealtime } from '../../lib/supabaseRealtime';
import { LeaderboardTable, LeaderboardEntry } from '../../components/LeaderboardTable';
import { Trophy, RefreshCw, Layers } from 'lucide-react';

export const TeamLeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [standings, setStandings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotCode, setSlotCode] = useState<string>('');
  const [slotNumber, setSlotNumber] = useState<number | null>(null);

  const fetchStandings = async () => {
    if (!user?.slot_id) return;
    setLoading(true);
    try {
      // Exclusively fetch standings for the team's joined slot
      const res = await apiClient.get(`/leaderboard/slot/${user.slot_id}`);
      setStandings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.slot_id && user?.event_id) {
      apiClient
        .get(`/slots/event/${user.event_id}`)
        .then((res) => {
          const mySlot = res.data.find((s: any) => s.id === user.slot_id);
          if (mySlot) {
            setSlotCode(mySlot.slot_code);
            setSlotNumber(mySlot.slot_number);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    fetchStandings();

    if (!user?.slot_id) return;

    // Realtime slot channel updates
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            {slotNumber ? `SLOT #${slotNumber} LEADERBOARD` : 'MY JOINED SLOT LEADERBOARD'} {slotCode ? `(CODE: ${slotCode})` : ''}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500" /> My Slot Live Rankings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time standings exclusively for teams competing in your assigned slot.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStandings}
            className="flex items-center gap-2 text-xs font-bold px-3 py-2 text-slate-700 hover:text-indigo-600 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all"
            title="Refresh Rankings"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" /> Refresh Rankings
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading your slot live rankings...</div>
      ) : (
        <LeaderboardTable entries={standings} currentTeamId={user?.id} isAdmin={false} />
      )}
    </div>
  );
};
