import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Plus, Play, CheckCircle, Clock, Copy, Users, Radio } from 'lucide-react';

export const SlotManager: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || '');
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [customCode, setCustomCode] = useState('');
  const [slotNumber, setSlotNumber] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/events').then((res) => {
      setEvents(res.data);
      if (!selectedEventId && res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    });
  }, []);

  const fetchSlots = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/slots/event/${selectedEventId}`);
      setSlots(res.data);
      setSlotNumber(res.data.length + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedEventId]);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      await apiClient.post('/slots', {
        event_id: selectedEventId,
        slot_number: slotNumber,
        custom_code: customCode || undefined,
      });
      setCustomCode('');
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create slot');
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
          <p className="text-sm text-slate-500 mt-1">Manage competitive event slots, unique join codes, and live round execution.</p>
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
        <div className="card h-fit border-indigo-100">
          <h3 className="text-lg font-extrabold text-slate-900 mb-1">Create Slot</h3>
          <p className="text-xs text-slate-500 mb-4">Generate a competitive slot with a unique join code for teams.</p>

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
                onChange={(e) => setSlotNumber(Number(e.target.value))}
                className="input-field text-sm"
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

            <button type="submit" disabled={!selectedEventId} className="btn-primary w-full gap-2">
              <Plus className="w-4 h-4" /> Generate Slot Code
            </button>
          </form>
        </div>

        {/* Slot List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600 animate-pulse" /> Active Slots
          </h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading slots...</div>
          ) : slots.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">
              No slots created yet for this event. Generate your first slot above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slots.map((slot) => (
                <div key={slot.id} className="card relative flex flex-col justify-between border-slate-200">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Slot #{slot.slot_number}
                      </span>
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

                    <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-4">
                      <span>Current Round:</span>
                      <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Round {slot.current_round}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2">
                      {slot.status === 'scheduled' && (
                        <button
                          onClick={() => handleUpdateStatus(slot.id, 'open')}
                          className="btn-secondary text-xs py-2 justify-center col-span-2"
                        >
                          Open Registration
                        </button>
                      )}

                      {slot.status === 'open' && (
                        <button
                          onClick={() => handleUpdateStatus(slot.id, 'in_progress', 1)}
                          className="btn-primary text-xs py-2 justify-center col-span-2 gap-1"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Start Live Round 1
                        </button>
                      )}

                      {slot.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateStatus(slot.id, 'in_progress', Math.min(5, slot.current_round + 1))
                            }
                            className="btn-secondary text-xs py-2 justify-center"
                          >
                            Advance Round ({slot.current_round}/5)
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(slot.id, 'completed')}
                            className="btn-danger text-xs py-2 justify-center"
                          >
                            Close Slot
                          </button>
                        </>
                      )}

                      {slot.status === 'completed' && (
                        <span className="text-xs font-semibold text-slate-400 text-center col-span-2 py-1">
                          Slot Finalized
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
