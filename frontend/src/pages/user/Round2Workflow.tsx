import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { resolveImageUrl } from '../../lib/imageUtils';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Layers, CheckCircle2, AlertCircle, Sparkles, Shuffle, ArrowLeft, ArrowRight, Move } from 'lucide-react';

export const Round2Workflow: React.FC = () => {
  const navigate = useNavigate();

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [selectedTapIndex, setSelectedTapIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
        const rawItems: { url: string }[] = res.data.items || [];
        setItems(rawItems.map((item) => item.url));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Swap two items at indexA and indexB
  const handleSwap = (idxA: number, idxB: number) => {
    if (idxA === idxB || idxA < 0 || idxB < 0 || idxA >= items.length || idxB >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const temp = next[idxA];
      next[idxA] = next[idxB];
      next[idxB] = temp;
      return next;
    });
    setSelectedTapIndex(null);
  };

  // Handle tap / click selection
  const handleTap = (index: number) => {
    if (selectedTapIndex === null) {
      setSelectedTapIndex(index);
    } else {
      handleSwap(selectedTapIndex, index);
    }
  };

  // Random shuffle
  const handleShuffle = () => {
    setItems((prev) => [...prev].sort(() => 0.5 - Math.random()));
    setSelectedTapIndex(null);
  };

  const handleSubmit = async () => {
    if (!challengeId || submitting || items.length === 0) return;

    setSubmitting(true);
    setFeedback(null);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await apiClient.post('/gameplay/round2/submit', {
        challenge_id: challengeId,
        submitted_urls: items,
        time_taken: timeTaken,
      });

      if (res.data.correct) {
        setTriggerConfetti(true);
        setFeedback({ message: `🎉 PERFECT WORKFLOW SEQUENCE! +${res.data.points} PTS AWARDED!`, type: 'success' });
        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else {
          setTimeout(() => navigate('/team/round-3'), 2500);
        }
      } else {
        setFeedback({ message: res.data.message || 'Sequence incorrect. Rearrange the pieces and try again!', type: 'error' });
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
    <div className="max-w-6xl mx-auto px-4 py-8">
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
            <Layers className="w-6 h-6 text-amber-500" /> {title || 'Image Order Challenge'}
          </h1>
        </div>

        <Timer isCountUp={true} isActive={!loading && items.length > 0} />
      </div>

      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex flex-wrap items-center justify-between gap-3">
        <div>
          💡 <strong>Task Instruction:</strong> Drag & drop images onto each other OR tap an image then tap another to swap them into the correct sequence!
        </div>
        <button
          onClick={handleShuffle}
          className="btn-secondary text-xs py-1.5 px-3 font-bold gap-1 flex items-center shadow-xs"
        >
          <Shuffle className="w-4 h-4 text-indigo-600" /> Shuffle Images
        </button>
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
          <div className={`grid gap-4 ${
            items.length <= 3
              ? 'grid-cols-1 sm:grid-cols-3'
              : items.length === 4
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
          }`}>
            {items.map((url, idx) => {
              const isTapSelected = selectedTapIndex === idx;
              return (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => setDraggedIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIndex !== null) {
                      handleSwap(draggedIndex, idx);
                      setDraggedIndex(null);
                    }
                  }}
                  onClick={() => handleTap(idx)}
                  className={`card p-3 border-2 transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between select-none ${
                    isTapSelected
                      ? 'border-amber-500 bg-amber-50/50 ring-4 ring-amber-200 shadow-xl scale-105'
                      : 'border-slate-200 hover:border-indigo-400 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                      <span className="font-mono text-indigo-600">POSITION #{idx + 1}</span>
                      {isTapSelected && (
                        <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">
                          TAP TARGET TO SWAP
                        </span>
                      )}
                    </div>

                    <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 mb-3 relative group">
                      <img
                        src={resolveImageUrl(url)}
                        alt={`Step ${idx + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Move className="w-4 h-4" /> Drag or Tap to Swap
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwap(idx, idx - 1);
                      }}
                      className="p-1.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 disabled:opacity-30 text-[11px] font-bold flex items-center gap-0.5"
                    >
                      <ArrowLeft className="w-3 h-3" /> Left
                    </button>

                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwap(idx, idx + 1);
                      }}
                      className="p-1.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 disabled:opacity-30 text-[11px] font-bold flex items-center gap-0.5"
                    >
                      Right <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary py-3.5 px-10 text-base font-extrabold shadow-xl shadow-indigo-200"
            >
              {submitting ? 'Verifying Sequence...' : 'Submit Final Sequence'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
