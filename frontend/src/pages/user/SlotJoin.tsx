import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { extractErrorMessage } from '../../lib/errorUtils';
import { Key, ArrowRight } from 'lucide-react';

export const SlotJoin: React.FC = () => {
  const [slotCode, setSlotCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { updateTeamSlot } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/slots/join', {
        slot_code: slotCode,
      });
      updateTeamSlot(res.data.slot_id);
      navigate('/team/play');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to join slot. Check your slot code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 shadow-xl border-indigo-100">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
          <Key className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-center text-slate-900 mb-1">Enter Event Slot Code</h2>
        <p className="text-xs text-center text-slate-500 mb-6">Ask the event organizer for your assigned slot code</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Slot Access Code
            </label>
            <input
              type="text"
              required
              value={slotCode}
              onChange={(e) => setSlotCode(e.target.value.toUpperCase())}
              placeholder="e.g. SLOT-A1"
              className="input-field text-center text-lg font-mono font-bold tracking-wider text-indigo-700 uppercase"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 font-bold gap-2">
            {loading ? 'Joining Slot...' : 'Join Event Slot'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
