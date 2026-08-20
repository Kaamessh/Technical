import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Plus, Play, Copy, Radio, Trash2, Save, Settings, Lock } from 'lucide-react';

export const SlotManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || '');
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [customCode, setCustomCode] = useState('');
  const [slotNumber, setSlotNumber] = useState<number | string>(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Per-Slot Question Limits for Round 3, Round 4, and Round 6 (Max available)
  const [maxR3Available, setMaxR3Available] = useState<number>(0);
  const [maxR4Available, setMaxR4Available] = useState<number>(0);
  const [maxR6Available, setMaxR6Available] = useState<number>(0);

  // String state for create form inputs so user can backspace and type single digits naturally
  const [r3LimitInput, setR3LimitInput] = useState<string>('1');
  const [r4LimitInput, setR4LimitInput] = useState<string>('1');
  const [r6LimitInput, setR6LimitInput] = useState<string>('6');

  // Edit limits state for existing slots (string inputs for backspace support)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editR3Input, setEditR3Input] = useState<string>('1');
  const [editR4Input, setEditR4Input] = useState<string>('1');
  const [editR6Input, setEditR6Input] = useState<string>('6');

  // Slot Claims tracking
  const [slotClaimsMap, setSlotClaimsMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    apiClient.get('/events').then((res) => {
      setEvents(res.data);
      if (!selectedEventId && res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    });
  }, []);

  const fetchAvailableQuestionCounts = async () => {
    if (!selectedEventId) return;
    try {
      const [r3Res, r4Res, r6Res] = await Promise.all([
        apiClient.get(`/ai-or-real/event/${selectedEventId}`).catch(() => ({ data: [] })),
        apiClient.get(`/data-challenge/event/${selectedEventId}`).catch(() => ({ data: [] })),
        apiClient.get(`/problem-statements/event/${selectedEventId}`).catch(() => ({ data: [] })),
      ]);

      const count3 = Array.isArray(r3Res.data) ? r3Res.data.length : 0;
      const count4 = Array.isArray(r4Res.data) ? r4Res.data.length : 0;
      const count6 = Array.isArray(r6Res.data) ? r6Res.data.length : 0;

      setMaxR3Available(count3);
      setMaxR4Available(count4);
      setMaxR6Available(count6);

      setR3LimitInput(count3 > 0 ? String(Math.min(3, count3)) : '1');
      setR4LimitInput(count4 > 0 ? String(Math.min(3, count4)) : '1');
      setR6LimitInput(count6 > 0 ? String(Math.min(6, count6)) : '6');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSlots = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/slots/event/${selectedEventId}`);
      const slotList = res.data || [];
      setSlots(slotList);
      setSlotNumber(slotList.length + 1);

      // Fetch problem statement claims for all slots
      const claimsObj: Record<string, any[]> = {};
      await Promise.all(
        slotList.map(async (s: any) => {
          try {
            const claimsRes = await apiClient.get(`/problem-statements/slot/${s.id}/claims`);
            claimsObj[s.id] = claimsRes.data || [];
          } catch (e) {
            claimsObj[s.id] = [];
          }
        })
      );
      setSlotClaimsMap(claimsObj);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    fetchAvailableQuestionCounts();
  }, [selectedEventId]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseLimitValue = (valStr: string, maxVal: number): number => {
    const parsed = parseInt(valStr, 10);
    if (isNaN(parsed) || parsed < 1) return 1;
    if (maxVal > 0 && parsed > maxVal) return maxVal;
    return parsed;
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || isSubmitting) return;

    const finalR3 = parseLimitValue(r3LimitInput, maxR3Available);
    const finalR4 = parseLimitValue(r4LimitInput, maxR4Available);
    const finalR6 = parseLimitValue(r6LimitInput, maxR6Available);

    setIsSubmitting(true);
    try {
      await apiClient.post('/slots', {
        event_id: selectedEventId,
        slot_number: Number(slotNumber) || 1,
        custom_code: customCode || undefined,
        r3_question_limit: finalR3,
        r4_question_limit: finalR4,
        r6_question_limit: finalR6,
      });
      setCustomCode('');
      setR3LimitInput(String(finalR3));
      setR4LimitInput(String(finalR4));
      setR6LimitInput(String(finalR6));
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (slotId: string, status: string, currentRound?: number) => {
    try {
      await apiClient.patch(`/slots/${slotId}`, { status, current_round: currentRound });
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update slot status');
    }
  };

  const handleSaveSlotLimits = async (slotId: string) => {
    const finalR3 = parseLimitValue(editR3Input, maxR3Available);
    const finalR4 = parseLimitValue(editR4Input, maxR4Available);
    const finalR6 = parseLimitValue(editR6Input, maxR6Available);

    try {
      await apiClient.patch(`/slots/${slotId}`, {
        r3_question_limit: finalR3,
        r4_question_limit: finalR4,
        r6_question_limit: finalR6,
      });
      setEditingSlotId(null);
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update slot question limits');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Are you sure you want to delete this slot? All associated data (teams, progress) will be deleted.')) {
      return;
    }
    try {
      await apiClient.delete(`/slots/${slotId}`);
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete slot');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Slot Control Center</h1>
          <p className="text-sm text-slate-500 mt-1">Manage competitive event slots, set Round 3 & Round 4 question limits, and trigger live rounds.</p>
        </div>

        {events.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="input-field text-sm font-semibold py-2 w-64 bg-white"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name} ({evt.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Slot Creation Form */}
        <div className="card h-fit border-indigo-100 space-y-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Create Slot</h3>
            <p className="text-xs text-slate-500">Configure a competitive slot with unique join code & round question limits.</p>
          </div>

          <form onSubmit={handleCreateSlot} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Slot Sequence Number
              </label>
              <input
                type="number"
                required
                min={1}
                value={slotNumber}
                onChange={(e) => setSlotNumber(e.target.value)}
                className="input-field text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Custom Join Code (Optional)
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="e.g. SLOT-101"
                className="input-field text-sm font-mono uppercase"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Leave blank to auto-generate (e.g. SLOT-4821)
              </span>
            </div>

            {/* Per-Slot Question Limits for Round 3, Round 4 & Round 6 */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 block flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-indigo-600" /> Per-Slot Round Question Limits
              </span>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Round 3 (AI vs Real) Questions:
                  </label>
                  <span className="text-[11px] font-bold font-mono text-indigo-600">
                    Max Available: {maxR3Available}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={r3LimitInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setR3LimitInput(val);
                    }
                  }}
                  onBlur={() => {
                    setR3LimitInput(String(parseLimitValue(r3LimitInput, maxR3Available)));
                  }}
                  placeholder="e.g. 1"
                  className="input-field text-sm font-bold"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Round 4 (Data Anomaly) Questions:
                  </label>
                  <span className="text-[11px] font-bold font-mono text-indigo-600">
                    Max Available: {maxR4Available}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={r4LimitInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setR4LimitInput(val);
                    }
                  }}
                  onBlur={() => {
                    setR4LimitInput(String(parseLimitValue(r4LimitInput, maxR4Available)));
                  }}
                  placeholder="e.g. 1"
                  className="input-field text-sm font-bold"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Round 6 Problem Cards:
                  </label>
                  <span className="text-[11px] font-bold font-mono text-indigo-600">
                    Max Available: {maxR6Available}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={r6LimitInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setR6LimitInput(val);
                    }
                  }}
                  onBlur={() => {
                    setR6LimitInput(String(parseLimitValue(r6LimitInput, maxR6Available)));
                  }}
                  placeholder="e.g. 6"
                  className="input-field text-sm font-bold"
                />
              </div>
            </div>

            <button type="submit" disabled={!selectedEventId || isSubmitting} className="btn-primary w-full gap-2 disabled:opacity-50">
              <Plus className="w-4 h-4" /> {isSubmitting ? 'Generating...' : 'Generate Slot Code'}
            </button>
          </form>
        </div>

        {/* Slot List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600 animate-pulse" /> Active Slots
          </h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400 font-bold">Loading slots...</div>
          ) : slots.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">
              No slots created yet for this event. Generate your first slot above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slots.map((slot) => {
                const isEditing = editingSlotId === slot.id;
                const r3Count = slot.r3_question_limit || 1;
                const r4Count = slot.r4_question_limit || 1;
                const r6Count = slot.r6_question_limit || 6;
                const claims = slotClaimsMap[slot.id] || [];
                // Editing is allowed ONLY before event begins (scheduled or open status)
                const canEditLimits = slot.status === 'scheduled' || slot.status === 'open';

                return (
                  <div key={slot.id} className="card relative flex flex-col justify-between border-slate-200">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Slot #{slot.slot_number}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              slot.status === 'in_progress'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
                                : slot.status === 'open'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : slot.status === 'completed'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {slot.status}
                          </span>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Join Code Box */}
                      <div className="bg-slate-900 rounded-xl p-4 text-center my-3 border border-slate-800 relative group">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">
                          Team Join Code
                        </div>
                        <div className="font-mono text-3xl font-black text-amber-400 tracking-widest">
                          {slot.slot_code}
                        </div>
                        <button
                          onClick={() => copyToClipboard(slot.slot_code)}
                          className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-white transition-colors"
                          title="Copy Code"
                        >
                          {copiedCode === slot.slot_code ? (
                            <span className="text-xs text-emerald-400 font-bold">Copied!</span>
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Slot Question Limits Settings Box */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase text-slate-700 flex items-center gap-1">
                            <Settings className="w-3 h-3 text-indigo-600" /> Limits:
                          </span>
                          {canEditLimits ? (
                            !isEditing ? (
                              <button
                                onClick={() => {
                                  setEditingSlotId(slot.id);
                                  setEditR3Input(String(r3Count));
                                  setEditR4Input(String(r4Count));
                                  setEditR6Input(String(r6Count));
                                }}
                                className="text-[11px] font-bold text-indigo-600 hover:underline"
                              >
                                Edit Limits
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSaveSlotLimits(slot.id)}
                                className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                              >
                                <Save className="w-3 h-3" /> Save
                              </button>
                            )
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1" title="Question limits locked once event starts">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>

                        {!isEditing ? (
                          <div className="grid grid-cols-3 gap-1.5 text-xs font-mono font-bold text-center">
                            <div className="bg-white p-1.5 rounded border border-slate-200 text-slate-700">
                              <span className="text-[9px] text-slate-400 block font-sans">R3 AI:</span>
                              <span className="text-indigo-600 font-black">{r3Count}</span>/{maxR3Available}
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200 text-slate-700">
                              <span className="text-[9px] text-slate-400 block font-sans">R4 Data:</span>
                              <span className="text-indigo-600 font-black">{r4Count}</span>/{maxR4Available}
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200 text-slate-700">
                              <span className="text-[9px] text-slate-400 block font-sans">R6 Cards:</span>
                              <span className="text-emerald-600 font-black">{r6Count}</span>/{maxR6Available}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 block mb-0.5">R3 Questions:</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={editR3Input}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d+$/.test(val)) {
                                    setEditR3Input(val);
                                  }
                                }}
                                onBlur={() => {
                                  setEditR3Input(String(parseLimitValue(editR3Input, maxR3Available)));
                                }}
                                className="input-field text-xs py-1 text-center font-bold"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 block mb-0.5">R4 Questions:</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={editR4Input}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d+$/.test(val)) {
                                    setEditR4Input(val);
                                  }
                                }}
                                onBlur={() => {
                                  setEditR4Input(String(parseLimitValue(editR4Input, maxR4Available)));
                                }}
                                className="input-field text-xs py-1 text-center font-bold"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 block mb-0.5">R6 Cards:</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={editR6Input}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d+$/.test(val)) {
                                    setEditR6Input(val);
                                  }
                                }}
                                onBlur={() => {
                                  setEditR6Input(String(parseLimitValue(editR6Input, maxR6Available)));
                                }}
                                className="input-field text-xs py-1 text-center font-bold"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Claimed Problem Statements Box */}
                      {claims.length > 0 && (
                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 mb-4 space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                            🎯 R6 Problem Claims ({claims.length}):
                          </span>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {claims.map((c: any, idx: number) => (
                              <div key={idx} className="text-[11px] text-slate-700 flex items-center justify-between bg-white px-2 py-1 rounded border border-emerald-100 font-mono">
                                <span><strong>{c.team_name}</strong></span>
                                <span className="text-emerald-700 font-bold">Card #{c.card_index !== undefined ? c.card_index + 1 : idx + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <div className="grid grid-cols-1 gap-2">
                        {slot.status === 'scheduled' && (
                          <button
                            onClick={() => handleUpdateStatus(slot.id, 'open')}
                            className="btn-secondary text-xs py-2 justify-center w-full"
                          >
                            Open Registration
                          </button>
                        )}

                        {slot.status === 'open' && (
                          <button
                            onClick={() => handleUpdateStatus(slot.id, 'in_progress', 1)}
                            className="btn-primary text-xs py-2 justify-center w-full gap-1"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> Start Live Round 1
                          </button>
                        )}

                        {slot.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(slot.id, 'completed')}
                            className="btn-danger text-xs py-2 justify-center w-full"
                          >
                            Close Slot
                          </button>
                        )}

                        {slot.status === 'completed' && (
                          <span className="text-xs font-semibold text-slate-400 text-center py-1">
                            Slot Finalized
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
