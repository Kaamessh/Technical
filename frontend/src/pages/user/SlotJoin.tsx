import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { KeyRound, Radio, ArrowRight } from 'lucide-react';

export const SlotJoin: React.FC = () => {
  const [slotCode, setSlotCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { updateTeamSlot, user } = useAuth();
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/slots/join', { slot_code: slotCode });
      if (res.data.token) {
        localStorage.setItem('auth_token', res.data.token);
      }
      updateTeamSlot(res.data.slot.id);
      navigate('/team/play');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join slot. Check your slot code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 shadow-xl border-indigo-100 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-xl border border-slate-800">
          <KeyRound className="w-8 h-8 animate-pulse" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Enter Event Slot Code</h2>
        <p className="text-xs text-slate-500 mb-6">
          Welcome <span className="font-bold text-indigo-600">{user?.name}</span>! Ask your event organizer for the slot code to begin live play.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Slot Code
            </label>
            <input
              type="text"
              required
              value={slotCode}
              onChange={(e) => setSlotCode(e.target.value.toUpperCase())}
              placeholder="SLOT-101"
              className="input-field text-center font-mono font-black text-2xl tracking-widest uppercase py-3 border-2 border-indigo-200 focus:border-indigo-600"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 font-bold gap-2 text-base">
            {loading ? 'Joining Slot...' : 'Join Slot Arena'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
