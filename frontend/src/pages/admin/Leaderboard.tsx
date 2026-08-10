import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { LeaderboardTable, LeaderboardEntry } from '../../components/LeaderboardTable';
import { Trophy, Globe, Layers, Edit3, RefreshCw } from 'lucide-react';

export const AdminLeaderboard: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('global');

  const [standings, setStandings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Manual Adjust Modal
  const [adjustingTeam, setAdjustingTeam] = useState<{ id: string; name: string } | null>(null);
  const [adjustPoints, setAdjustPoints] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    apiClient.get('/events').then((res) => {
      setEvents(res.data);
      if (res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      apiClient.get(`/slots/event/${selectedEventId}`).then((res) => {
        setSlots(res.data);
      });
    }
  }, [selectedEventId]);

  const fetchLeaderboard = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      if (selectedSlotId === 'global') {
        const res = await apiClient.get(`/leaderboard/global/${selectedEventId}`);
        setStandings(res.data);
      } else {
        const res = await apiClient.get(`/leaderboard/slot/${selectedSlotId}`);
        setStandings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedEventId, selectedSlotId]);

  const handleOpenAdjustModal = (teamId: string, teamName: string, currentTotalPoints: number) => {
    setAdjustingTeam({ id: teamId, name: teamName, currentPoints: currentTotalPoints });
    setTargetTotalPoints(currentTotalPoints);
    setAdjustPoints(0);
    setEditMode('set_total');
    setAdjustReason('Admin point modification');
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingTeam) return;

    let pointsToSubmit = 0;
    if (editMode === 'set_total') {
      pointsToSubmit = Number(targetTotalPoints) - adjustingTeam.currentPoints;
    } else {
      pointsToSubmit = Number(adjustPoints);
    }

    if (pointsToSubmit === 0 && editMode === 'set_total') {
      alert('New total points matches current points. No change needed.');
      return;
    }

    try {
      await apiClient.post('/points/adjust', {
        team_id: adjustingTeam.id,
        points: pointsToSubmit,
        reason: adjustReason || (editMode === 'set_total' ? `Direct total set to ${targetTotalPoints}` : 'Point adjustment'),
      });
      setAdjustingTeam(null);
      setAdjustReason('');
      fetchLeaderboard();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to adjust points');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500" /> Event Standings & Audit
          </h1>
          <p className="text-sm text-slate-500 mt-1">Live point aggregates, slot rankings, and manual administrative point adjustments.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setSelectedSlotId('global');
              }}
              className="input-field text-xs font-semibold py-2 w-48 bg-white"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          )}

          {/* Toggle Global vs Slot */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setSelectedSlotId('global')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedSlotId === 'global' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Global
            </button>

            {slots.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSlotId(s.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedSlotId === s.id ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Slot #{s.slot_number} ({s.slot_code})
              </button>
            ))}
          </div>

          <button onClick={fetchLeaderboard} className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg bg-white border border-slate-200">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading standings...</div>
      ) : (
        <LeaderboardTable entries={standings} isAdmin={true} onAdjustPoints={handleOpenAdjustModal} />
      )}

      {/* Edit Points Modal */}
      {adjustingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="card max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Edit Team Points</h3>
            <p className="text-xs text-slate-500 mb-4">
              Team: <span className="font-bold text-slate-900">{adjustingTeam.name}</span> | Current Total:{' '}
              <span className="font-bold text-indigo-600 font-mono">{adjustingTeam.currentPoints} pts</span>
            </p>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-bold border border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditMode('set_total')}
                  className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                    editMode === 'set_total' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Direct Total Points
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode('relative')}
                  className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                    editMode === 'relative' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  +/- Add / Subtract
                </button>
              </div>

              {editMode === 'set_total' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Set New Total Points
                  </label>
                  <input
                    type="number"
                    required
                    value={targetTotalPoints}
                    onChange={(e) => setTargetTotalPoints(Number(e.target.value))}
                    className="input-field text-lg font-mono font-bold text-indigo-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Calculated adjustment entry:{' '}
                    <span className="font-bold text-slate-900 font-mono">
                      {Number(targetTotalPoints) - adjustingTeam.currentPoints >= 0
                        ? `+${Number(targetTotalPoints) - adjustingTeam.currentPoints}`
                        : `${Number(targetTotalPoints) - adjustingTeam.currentPoints}`}{' '}
                      pts
                    </span>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Points Adjustment (+/- numeric value)
                  </label>
                  <input
                    type="number"
                    required
                    value={adjustPoints}
                    onChange={(e) => setAdjustPoints(Number(e.target.value))}
                    placeholder="e.g. 50 or -20"
                    className="input-field text-sm font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Audit Reason
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Admin manual correction"
                  className="input-field text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAdjustingTeam(null)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs font-bold">
                  Save & Update Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
