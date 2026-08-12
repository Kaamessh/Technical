import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { LeaderboardTable, LeaderboardEntry } from '../../components/LeaderboardTable';
import { Trophy, Globe, Layers, RefreshCw, Settings, Calculator, ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const AdminLeaderboard: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('global');

  const [standings, setStandings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Task Settings State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [taskSettings, setTaskSettings] = useState({
    task1_pmax: 100,
    task2_pmax: 100,
    task3_pmax: 100,
    task4_pmax: 100,
    task5_pmax: 0,
  });

  // Audit Attempts Modal State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [taskAttempts, setTaskAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Manual Adjust Modal
  const [adjustingTeam, setAdjustingTeam] = useState<{ id: string; name: string; currentPoints: number } | null>(null);
  const [editMode, setEditMode] = useState<'set_total' | 'relative'>('set_total');
  const [targetTotalPoints, setTargetTotalPoints] = useState<number>(0);
  const [adjustPoints, setAdjustPoints] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Admin point modification');

  useEffect(() => {
    apiClient.get('/events').then((res) => {
      setEvents(res.data);
      if (res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    });

    apiClient.get('/points/task-settings').then((res) => {
      setTaskSettings(res.data);
    }).catch(() => {});
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

  const handleSaveTaskSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/points/task-settings', taskSettings);
      setShowSettingsModal(false);
      alert('Task P_max settings updated successfully!');
      fetchLeaderboard();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update task settings');
    }
  };

  const handleOpenAuditModal = async () => {
    const slotToFetch = selectedSlotId === 'global' ? (slots.length > 0 ? slots[0].id : '') : selectedSlotId;
    if (!slotToFetch) {
      alert('Please select a slot to view task attempts audit.');
      return;
    }

    setShowAuditModal(true);
    setLoadingAttempts(true);
    try {
      const res = await apiClient.get(`/points/task-attempts/${slotToFetch}`);
      setTaskAttempts(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleRecalculateSlot = async () => {
    const slotToRecalc = selectedSlotId === 'global' ? (slots.length > 0 ? slots[0].id : '') : selectedSlotId;
    if (!slotToRecalc) {
      alert('Please select a specific slot to recalculate.');
      return;
    }

    if (!confirm('Recalculate task scores for this slot using core formula? Manual overrides will be preserved.')) return;

    try {
      await apiClient.post(`/points/recalculate-slot/${slotToRecalc}`);
      alert('Slot scores recalculated successfully!');
      fetchLeaderboard();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Recalculation failed');
    }
  };

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
        reason: `MANUAL_OVERRIDE: ${adjustReason || (editMode === 'set_total' ? `Set total to ${targetTotalPoints}` : 'Adjustment')}`,
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500" /> Event Standings & Normalized Scoring
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fair cross-slot scoring formula: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-600 font-bold">TaskScore = round( P_max × (N - rank + 1) / N )</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {events.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Event:</span>
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setSelectedSlotId('global');
                }}
                className="input-field text-xs font-semibold py-2 w-44 bg-white"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Slot Selector Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase">Slot:</span>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="input-field text-xs font-semibold py-2 w-52 bg-white text-indigo-700 border-indigo-200"
            >
              <option value="global">🌐 All Slots (Global Standings)</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  📍 Slot #{s.slot_number} ({s.slot_code})
                </option>
              ))}
            </select>
          </div>

          <button onClick={() => setShowSettingsModal(true)} className="btn-secondary text-xs py-2 gap-1 flex items-center font-bold">
            <Settings className="w-4 h-4 text-indigo-600" /> P_max Settings
          </button>

          <button onClick={handleOpenAuditModal} className="btn-secondary text-xs py-2 gap-1 flex items-center font-bold">
            <Calculator className="w-4 h-4 text-amber-500" /> Task Audit
          </button>

          {selectedSlotId !== 'global' && (
            <button onClick={handleRecalculateSlot} className="btn-secondary text-xs py-2 gap-1 flex items-center font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50">
              <RefreshCw className="w-3.5 h-3.5" /> Recalculate
            </button>
          )}
        </div>
      </div>

      {/* Quick Slot Filter Pills */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase mr-1">Quick Select:</span>
        <button
          onClick={() => setSelectedSlotId('global')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
            selectedSlotId === 'global'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> All Slots (Global)
        </button>

        {slots.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSlotId(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
              selectedSlotId === s.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Slot #{s.slot_number} ({s.slot_code})
          </button>
        ))}
      </div>

      {/* Selected Slot Information Banner */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            {selectedSlotId === 'global' ? <Globe className="w-5 h-5" /> : <Layers className="w-5 h-5 text-amber-400" />}
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">ACTIVE LEADERBOARD VIEW</span>
            <h2 className="text-base font-extrabold text-white">
              {selectedSlotId === 'global'
                ? 'Global Event Standings (Normalized Sum Across All Slots)'
                : `Slot Leaderboard — Slot #${slots.find((s) => s.id === selectedSlotId)?.slot_number || ''} (${slots.find((s) => s.id === selectedSlotId)?.slot_code || ''})`}
            </h2>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-slate-400">Teams in View:</span>
          <span className="ml-2 font-mono font-bold text-amber-400 text-sm">{standings.length} Teams</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading standings...</div>
      ) : (
        <LeaderboardTable entries={standings} isAdmin={true} onAdjustPoints={handleOpenAdjustModal} />
      )}

      {/* MODAL 1: EDIT P_MAX SETTINGS */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="card max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" /> Admin Task P_max Settings
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Set maximum available points (<code className="font-bold text-indigo-600">P_max</code>) per task. Formula automatically calculates scores: <code className="bg-slate-100 px-1 py-0.5 font-bold">round(P_max × (N - rank + 1) / N)</code>.
            </p>

            <form onSubmit={handleSaveTaskSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Task 1: Live Quiz P_max</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={taskSettings.task1_pmax}
                    onChange={(e) => setTaskSettings({ ...taskSettings, task1_pmax: Number(e.target.value) })}
                    className="input-field text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Task 2: Workflow P_max</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={taskSettings.task2_pmax}
                    onChange={(e) => setTaskSettings({ ...taskSettings, task2_pmax: Number(e.target.value) })}
                    className="input-field text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Task 3: AI vs Real P_max</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={taskSettings.task3_pmax}
                    onChange={(e) => setTaskSettings({ ...taskSettings, task3_pmax: Number(e.target.value) })}
                    className="input-field text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Task 4: Spot Data P_max</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={taskSettings.task4_pmax}
                    onChange={(e) => setTaskSettings({ ...taskSettings, task4_pmax: Number(e.target.value) })}
                    className="input-field text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs font-bold">
                  Save P_max Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAILED TASK ATTEMPTS AUDIT */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="card max-w-4xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-500" /> Per-Task Attempts & Formula Audit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed task completion timestamp, computed rank, N (slot size), and formula task scores.
                </p>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            {loadingAttempts ? (
              <div className="py-12 text-center text-slate-400">Loading audit attempts data...</div>
            ) : (
              <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Team Name</th>
                      <th className="py-2.5 px-3">Task ID / Type</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Completion Timestamp (ms)</th>
                      <th className="py-2.5 px-3 text-center">Rank</th>
                      <th className="py-2.5 px-3 text-center">N (Slot Size)</th>
                      <th className="py-2.5 px-3 text-right">Computed TaskScore</th>
                      <th className="py-2.5 px-3 text-center">Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {taskAttempts.map((att, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{att.team_name}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-semibold">
                            Task #{att.task_id} ({att.task_type})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {att.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-semibold">
                              <XCircle className="w-3 h-3" /> Did Not Finish (0 pts)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {att.completion_timestamp_ms ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" /> {att.completion_timestamp_ms} ms
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono">
                          {att.computed_rank > 0 ? `#${att.computed_rank}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{att.n_participants}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-indigo-600 text-sm">
                          {att.computed_task_score} pts
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {att.is_manual_override ? (
                            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-300">
                              MANUAL OVERRIDE
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">AUTO</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT POINTS / MANUAL OVERRIDE */}
      {adjustingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="card max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-extrabold text-slate-900">Edit Team Points</h3>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Manual Override Protected
              </span>
            </div>
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
