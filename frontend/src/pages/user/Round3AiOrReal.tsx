import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Sparkles, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

export const Round3AiOrReal: React.FC = () => {
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null);

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Decode popup
  const [showDecode, setShowDecode] = useState(false);
  const [decodePair, setDecodePair] = useState<number[] | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  useEffect(() => {
    apiClient
      .get('/gameplay/round3/challenge')
      .then((res) => {
        setChallenge(res.data);
        setStartTime(Date.now());
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (side: 'A' | 'B') => {
    if (!challenge || submitting) return;
    setSelectedSide(side);
    setSubmitting(true);
    setFeedback(null);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await apiClient.post('/gameplay/round3/submit', {
        challenge_id: challenge.id,
        selected_side: side,
        time_taken: timeTaken,
      });

      if (res.data.correct) {
        setTriggerConfetti(true);
        setFeedback({ message: `✨ SPOT ON! AI IMAGE IDENTIFIED! +${res.data.points} PTS AWARDED!`, type: 'success' });
        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else {
          setTimeout(() => navigate('/team/round-4'), 2500);
        }
      } else {
        setFeedback({ message: res.data.message || 'Incorrect choice. Inspect the textures carefully!', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ message: err.response?.data?.error || 'Submission error', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissDecode = () => {
    setShowDecode(false);
    navigate('/team/round-4');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {triggerConfetti && <ConfettiEffect />}
      {showDecode && (
        <DecodePopup roundNumber={3} pairNumbers={decodePair} onDismiss={handleDismissDecode} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            ROUND 3 OF 5 — AI OR REAL DETECTION
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" /> Spot the Synthetic AI Image
          </h1>
        </div>

        <Timer isCountUp={true} isActive={!loading && !!challenge} />
      </div>

      <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium">
        🔍 <strong>Task Instruction:</strong> Examine both high-resolution image options below. Click on the image you believe is <strong>AI-GENERATED</strong>!
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl font-bold text-sm flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-slate-400">Loading AI detection pair...</div>
      ) : !challenge ? (
        <div className="card text-center py-12 text-slate-400">No challenge pair available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Option A */}
          <div
            onClick={() => handleSubmit('A')}
            className={`card p-4 border-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
              selectedSide === 'A' ? 'border-indigo-600 shadow-xl' : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-lg text-slate-900">OPTION A</span>
                <Eye className="w-5 h-5 text-slate-400" />
              </div>

              <div className="aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-200 mb-4">
                <img src={challenge.image_a_url} alt="Option A" className="w-full h-full object-cover" />
              </div>
            </div>

            <button
              disabled={submitting}
              className="btn-primary w-full py-3 text-sm font-bold justify-center"
            >
              Select Option A as AI
            </button>
          </div>

          {/* Option B */}
          <div
            onClick={() => handleSubmit('B')}
            className={`card p-4 border-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
              selectedSide === 'B' ? 'border-indigo-600 shadow-xl' : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-lg text-slate-900">OPTION B</span>
                <Eye className="w-5 h-5 text-slate-400" />
              </div>

              <div className="aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-200 mb-4">
                <img src={challenge.image_b_url} alt="Option B" className="w-full h-full object-cover" />
              </div>
            </div>

            <button
              disabled={submitting}
              className="btn-primary w-full py-3 text-sm font-bold justify-center"
            >
              Select Option B as AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
