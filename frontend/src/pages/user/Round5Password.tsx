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
        setFeedback({
          message: res.data.message || `🎉 CONGRATULATIONS! PASSWORD DECODED! +${res.data.points || 100} PTS!`,
          type: 'success',
        });
        setTimeout(() => navigate('/team/round-6'), 1000);
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
            ROUND 5 OF 6 — BINARY TERMINAL UNLOCK
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

            {/* Unlock Instructions */}
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2 font-sans">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Unlock Instructions
                </div>
                <ul className="text-xs text-slate-300 font-sans space-y-1.5 list-disc list-inside">
                  <li><strong>Step 1:</strong> Convert the <strong>Binary Clue</strong> above into its decimal number (e.g. <code className="text-amber-400 font-mono">1101110101</code> = <code className="text-amber-400 font-mono">885</code>).</li>
                  <li><strong>Step 2:</strong> Decode your team's puzzle letter numbers from Rounds 1–4 into your <strong>Target Word</strong> (e.g. <code className="text-indigo-400 font-mono">5,12,5,16,8,1,14,20</code> = <code className="text-indigo-400 font-mono">ELEPHANT</code>).</li>
                  <li><strong>Step 3:</strong> Combine them into <code className="text-emerald-400 font-mono">[Number][Word]</code> (e.g. <code className="text-emerald-400 font-mono">885elephant</code>).</li>
                </ul>
              </div>
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
                  placeholder="e.g. 885elephant or 885ELEPHANT"
                  className="w-full px-5 py-4 rounded-xl bg-slate-950 border-2 border-emerald-500/50 text-white font-mono text-xl font-bold tracking-wider focus:outline-none focus:border-emerald-400 transition-all placeholder-slate-600 uppercase sm:normal-case"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-2 text-[11px] text-slate-500 font-sans">
                <span>
                  Format: <code className="text-emerald-400 font-mono">[DecimalValue][TargetWord]</code>
                </span>
                <span className="text-amber-400 font-medium">
                  ✓ Case-Free (small or capital letters accepted)
                </span>
              </div>
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
