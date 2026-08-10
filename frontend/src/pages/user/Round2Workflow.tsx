import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Layers, ArrowLeftRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const Round2Workflow: React.FC = () => {
  const navigate = useNavigate();

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<{ url: string; originalIndex: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const [startTime] = useState<number>(Date.now());
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Decode popup
  const [showDecode, setShowDecode] = useState(false);
  const [decodePair, setDecodePair] = useState<number[] | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  useEffect(() => {
    apiClient
      .get('/gameplay/round2/challenge')
      .then((res) => {
        setChallengeId(res.data.id);
        setTitle(res.data.title);
        setItems(res.data.items);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleMove = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[fromIndex];
    newItems[fromIndex] = newItems[toIndex];
    newItems[toIndex] = temp;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!challengeId || submitting) return;
    setSubmitting(true);
    setFeedback(null);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const submittedUrls = items.map((i) => i.url);

    try {
      const res = await apiClient.post('/gameplay/round2/submit', {
        challenge_id: challengeId,
        submitted_urls: submittedUrls,
        time_taken: timeTaken,
      });

      if (res.data.correct) {
        setTriggerConfetti(true);
        setFeedback({ message: `🎉 PERFECT SEQUENCE! +${res.data.points} PTS AWARDED!`, type: 'success' });
        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else {
          setTimeout(() => navigate('/team/round-3'), 2500);
        }
      } else {
        setFeedback({ message: res.data.message || 'Sequence incorrect. Adjust your pieces!', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ message: err.response?.data?.error || 'Submission error', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissDecode = () => {
    setShowDecode(false);
    navigate('/team/round-3');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {triggerConfetti && <ConfettiEffect />}
      {showDecode && (
        <DecodePopup roundNumber={2} pairNumbers={decodePair} onDismiss={handleDismissDecode} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            ROUND 2 OF 5 — WORKFLOW SEQUENCE
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-500" /> {title || 'Image-Order Challenge'}
          </h1>
        </div>

        <Timer isCountUp={true} isActive={!loading && items.length > 0} />
      </div>

      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
        💡 <strong>Task Instruction:</strong> Reorder the shuffled pieces into the correct sequence from left to right. Use the left/right arrows to swap adjacent steps!
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
        <div className="card text-center py-12 text-slate-400">Loading workflow challenge...</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">No workflow challenge available.</div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item, idx) => (
              <div key={idx} className="card p-3 border-2 border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                    <span className="font-mono text-indigo-600">POSITION #{idx + 1}</span>
                  </div>

                  <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 mb-3">
                    <img src={item.url} alt={`Step ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'left')}
                    className="p-1.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 disabled:opacity-30"
                  >
                    ← Move Left
                  </button>

                  <button
                    disabled={idx === items.length - 1}
                    onClick={() => handleMove(idx, 'right')}
                    className="p-1.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 disabled:opacity-30"
                  >
                    Move Right →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary py-3 px-8 text-base font-extrabold shadow-lg shadow-indigo-200"
            >
              {submitting ? 'Verifying Order...' : 'Submit Final Sequence'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
