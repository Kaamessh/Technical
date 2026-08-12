import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Timer } from '../../components/Timer';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { KeyRound, Binary, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export const Round5Password: React.FC = () => {
  const navigate = useNavigate();

  const [binaryClue, setBinaryClue] = useState<string | null>(null);
  const [letterNumbers, setLetterNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const [passwordInput, setPasswordInput] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    apiClient
      .get('/gameplay/round5/clue')
      .then((res) => {
        setBinaryClue(res.data.binary_clue);
        setLetterNumbers(res.data.letter_numbers || []);
        setStartTime(Date.now());
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput || submitting) return;
    setSubmitting(true);
    setFeedback(null);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await apiClient.post('/gameplay/round5/verify-password', {
        password: passwordInput,
        time_taken: timeTaken,
      });

      if (res.data.correct) {
        setTriggerConfetti(true);
        setFeedback({ message: '🎉 CONGRATULATIONS! EVENT FINALE DECODED SUCCESSFULLY!', type: 'success' });
        setTimeout(() => navigate('/team/completed'), 2500);
      } else {
        setFeedback({ message: res.data.message || 'Invalid password. Check your binary conversion and decoded word!', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ message: err.response?.data?.error || 'Verification error', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-mono">
      {triggerConfetti && <ConfettiEffect />}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            ROUND 5 OF 5 — FINAL BINARY DECODE
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans mt-2 flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-amber-500" /> Terminal Password Unlock
          </h1>
        </div>

        <Timer isCountUp={true} isActive={!loading && !!binaryClue} />
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl font-bold text-sm flex items-center gap-2 font-sans ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-slate-400">Loading terminal decode clue...</div>
      ) : (
        <div className="card-terminal p-8 shadow-2xl space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-500 ml-2">cyber-decrypt-v2.0</span>
            </div>

            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
              Status: FINALE LOCK ACTIVE
            </span>
          </div>

          {/* Clues Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Binary Clue */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Binary className="w-4 h-4 text-emerald-400" /> Binary Clue String
              </div>
              <div className="text-4xl font-extrabold text-amber-400 tracking-widest my-2">
                {binaryClue || '1111'}
              </div>
            </div>

            {/* Letter Numbers Hints */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Letter Position Hints (1..26)
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 tracking-wider my-2">
                [{letterNumbers.join(', ')}]
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Alphabet positions (A=1, B=2... Z=26) representing your target word!
              </p>
            </div>
          </div>

          {/* Password Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 font-sans">
                Enter Decoded Password
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter decoded password..."
                  className="w-full px-5 py-4 rounded-xl bg-slate-950 border-2 border-emerald-500/50 text-white font-mono text-xl font-bold tracking-wider focus:outline-none focus:border-emerald-400 transition-all placeholder-slate-600"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block font-sans">
                Format: <code className="text-emerald-400 font-mono">[DecimalValue][TargetWord]</code> (case-insensitive)
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-accent w-full py-4 text-lg font-black tracking-wider uppercase font-sans shadow-lg shadow-amber-500/20"
            >
              {submitting ? 'Decrypting Password...' : 'UN-LOCK EVENT FINALE'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
