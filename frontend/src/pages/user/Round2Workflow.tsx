import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { resolveImageUrl } from '../../lib/imageUtils';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Layers, CheckCircle2, AlertCircle, Sparkles, Move, RefreshCw, Shuffle } from 'lucide-react';

export const Round2Workflow: React.FC = () => {
  const navigate = useNavigate();

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  
  // All items fetched from backend: [{ id: '...', url: '...' }, ...]
  const [allItems, setAllItems] = useState<{ id: string; url: string }[]>([]);
  // Placed slots array: (string | null)[] storing item IDs
  const [slots, setSlots] = useState<(string | null)[]>([]);

  const [loading, setLoading] = useState(true);
  const [startTime] = useState<number>(Date.now());
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

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
        const items = rawItems.map((item, idx) => ({
          id: `img-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          url: item.url,
        }));
        setAllItems(items);
        setSlots(new Array(items.length).fill(null));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Derived unplaced items in pool
  const placedIds = new Set(slots.filter((id): id is string => id !== null));
  const poolItems = allItems.filter((item) => !placedIds.has(item.id));

  // Place item into target slot or first empty slot
  const handlePlaceItem = (itemId: string, targetSlotIdx?: number) => {
    setSlots((prevSlots) => {
      const next = [...prevSlots];
      
      // If item is already in a slot, clear its old position
      const currentIdx = next.indexOf(itemId);
      if (currentIdx !== -1) {
        next[currentIdx] = null;
      }

      if (targetSlotIdx !== undefined && targetSlotIdx >= 0 && targetSlotIdx < next.length) {
        next[targetSlotIdx] = itemId;
      } else {
        const emptyIdx = next.findIndex((s) => s === null);
        if (emptyIdx !== -1) {
          next[emptyIdx] = itemId;
        }
      }
      return next;
    });
  };

  // Remove item from slot back to pool
  const handleRemoveFromSlot = (slotIdx: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  };

  // Reset all slots back to pool
  const handleResetAll = () => {
    setSlots(new Array(allItems.length).fill(null));
  };

  // Shuffle floating pool items
  const handleShufflePool = () => {
    setAllItems((prev) => [...prev].sort(() => 0.5 - Math.random()));
  };

  const handleSubmit = async () => {
    if (!challengeId || submitting) return;

    if (slots.some((s) => s === null)) {
      setFeedback({ message: '⚠️ Please place an image into every order box before submitting!', type: 'error' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const submittedUrls = slots.map((id) => allItems.find((item) => item.id === id)?.url || '');

    try {
      const res = await apiClient.post('/gameplay/round2/submit', {
        challenge_id: challengeId,
        submitted_urls: submittedUrls,
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
        setFeedback({ message: res.data.message || 'Sequence incorrect. Rearrange and try again!', type: 'error' });
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

        <Timer isCountUp={true} isActive={!loading && allItems.length > 0} />
      </div>

      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between gap-3">
        <div>
          💡 <strong>Task Instruction:</strong> Drag or click floating images from the pool below into the numbered <strong>Order Boxes</strong> in the correct workflow sequence.
        </div>
        <button
          type="button"
          onClick={handleShufflePool}
          className="btn-secondary text-xs py-1.5 px-3 font-bold gap-1 flex items-center shadow-xs shrink-0"
        >
          <Shuffle className="w-3.5 h-3.5 text-indigo-600" /> Shuffle Pool
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
      ) : allItems.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">No workflow challenge available.</div>
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: ORDER BOXES */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Sequence Order Boxes ({slots.filter(Boolean).length}/{slots.length})
              </h3>
              {slots.some((s) => s !== null) && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Order Boxes
                </button>
              )}
            </div>

            <div className={`grid gap-4 ${
              slots.length <= 3
                ? 'grid-cols-1 sm:grid-cols-3'
                : slots.length === 4
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
            }`}>
              {slots.map((slotItemId, idx) => {
                const item = slotItemId ? allItems.find((i) => i.id === slotItemId) : null;
                return (
                  <div
                    key={idx}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedItemId) {
                        handlePlaceItem(draggedItemId, idx);
                        setDraggedItemId(null);
                      }
                    }}
                    className={`card p-3 border-2 transition-all flex flex-col justify-between min-h-[190px] ${
                      item
                        ? 'border-indigo-500 bg-indigo-50/20 shadow-md'
                        : 'border-dashed border-slate-300 bg-slate-50/50 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="font-mono text-indigo-600">STEP #{idx + 1}</span>
                      {item && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                          Click to Remove
                        </span>
                      )}
                    </div>

                    {item ? (
                      <div
                        onClick={() => handleRemoveFromSlot(idx)}
                        className="aspect-video rounded-lg overflow-hidden bg-slate-900 border border-indigo-200 relative group cursor-pointer"
                      >
                        <img
                          src={resolveImageUrl(item.url)}
                          alt={`Placed Step ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          Click to Remove
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-lg text-slate-400">
                        <Move className="w-6 h-6 mb-1 text-slate-300" />
                        <span className="text-[11px] font-bold text-slate-400 text-center">
                          Drop or Tap Image Here
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: FLOATING IMAGES POOL */}
          <div className="card p-6 bg-slate-900 border-slate-800 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4" /> Floating Images Pool ({poolItems.length} remaining)
              </h3>
              {poolItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleShufflePool}
                  className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
                >
                  <Shuffle className="w-3 h-3 text-amber-400" /> Shuffle Pool
                </button>
              )}
            </div>

            {poolItems.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                All images placed into order boxes! Click "Submit Final Sequence" below when ready.
              </div>
            ) : (
              <div className={`grid gap-4 ${
                poolItems.length <= 3
                  ? 'grid-cols-1 sm:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              }`}>
                {poolItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedItemId(item.id)}
                    onDragEnd={() => setDraggedItemId(null)}
                    onClick={() => handlePlaceItem(item.id)}
                    className="group relative aspect-video rounded-xl overflow-hidden bg-slate-950 border-2 border-slate-700 hover:border-amber-400 cursor-grab active:cursor-grabbing transition-all hover:scale-105 shadow-lg"
                  >
                    <img
                      src={resolveImageUrl(item.url)}
                      alt="Floating challenge piece"
                      className="w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                      <span className="text-xs font-extrabold text-amber-300">Tap / Drag to Place</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={submitting || slots.some((s) => s === null)}
              className="btn-primary py-3.5 px-10 text-base font-extrabold shadow-xl shadow-indigo-200 disabled:opacity-50"
            >
              {submitting ? 'Verifying Sequence...' : 'Submit Final Sequence'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
