import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Layers, CheckCircle2, AlertCircle, Sparkles, Move, RefreshCw } from 'lucide-react';

export const Round2Workflow: React.FC = () => {
  const navigate = useNavigate();

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  
  // Unplaced floating pool items
  const [pool, setPool] = useState<{ id: string; url: string }[]>([]);
  // Placed slots array (length matches total images)
  const [slots, setSlots] = useState<(string | null)[]>([]);

  const [loading, setLoading] = useState(true);
  const [startTime] = useState<number>(Date.now());
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draggedUrl, setDraggedUrl] = useState<string | null>(null);

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
        const poolItems = rawItems.map((item, idx) => ({ id: `img-${idx}-${Date.now()}`, url: item.url }));
        setPool(poolItems);
        setSlots(new Array(rawItems.length).fill(null));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Place floating image into specific slot or first available slot
  const handleAssignToSlot = (url: string, targetSlotIdx?: number) => {
    // Remove from pool
    setPool((prev) => prev.filter((item) => item.url !== url));

    setSlots((prevSlots) => {
      const next = [...prevSlots];
      
      // If image is already in a slot, clear its old slot
      const oldIdx = next.indexOf(url);
      if (oldIdx !== -1) {
        next[oldIdx] = null;
      }

      if (targetSlotIdx !== undefined && targetSlotIdx >= 0 && targetSlotIdx < next.length) {
        // If target slot is occupied, put occupied image back to pool
        const existingInSlot = next[targetSlotIdx];
        if (existingInSlot && existingInSlot !== url) {
          setPool((p) => [...p, { id: `img-return-${Date.now()}`, url: existingInSlot }]);
        }
        next[targetSlotIdx] = url;
      } else {
        // Find first empty slot
        const emptyIdx = next.findIndex((s) => s === null);
        if (emptyIdx !== -1) {
          next[emptyIdx] = url;
        }
      }
      return next;
    });
  };

  // Remove image from slot back to floating pool
  const handleRemoveFromSlot = (slotIdx: number) => {
    const url = slots[slotIdx];
    if (!url) return;

    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });

    setPool((prev) => [...prev, { id: `img-returned-${Date.now()}`, url }]);
  };

  // Reset all slots
  const handleResetAll = () => {
    const allUrls = slots.filter((u): u is string => u !== null);
    setPool((prev) => [...prev, ...allUrls.map((url, i) => ({ id: `reset-${i}-${Date.now()}`, url }))]);
    setSlots(new Array(slots.length).fill(null));
  };

  const handleSubmit = async () => {
    if (!challengeId || submitting) return;

    // Verify all slots are filled
    if (slots.some((s) => s === null)) {
      setFeedback({ message: '⚠️ Please place an image in every order box before submitting!', type: 'error' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const submittedUrls = slots as string[];

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
            <Layers className="w-6 h-6 text-amber-500" /> {title || 'Image Order Challenge'}
          </h1>
        </div>

        <Timer isCountUp={true} isActive={!loading && (pool.length > 0 || slots.some((s) => s !== null))} />
      </div>

      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
        💡 <strong>Task Instruction:</strong> Drag or click/double-tap floating images from the pool below into the numbered <strong>Order Boxes</strong> in the correct workflow sequence.
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
      ) : slots.length === 0 ? (
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
                  onClick={handleResetAll}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Order Boxes
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {slots.map((slotUrl, idx) => (
                <div
                  key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedUrl) {
                      handleAssignToSlot(draggedUrl, idx);
                      setDraggedUrl(null);
                    }
                  }}
                  className={`card p-3 border-2 transition-all flex flex-col justify-between min-h-[180px] ${
                    slotUrl
                      ? 'border-indigo-500 bg-indigo-50/20 shadow-md'
                      : 'border-dashed border-slate-300 bg-slate-50/50 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="font-mono text-indigo-600">STEP #{idx + 1}</span>
                    {slotUrl && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                        Double-tap to remove
                      </span>
                    )}
                  </div>

                  {slotUrl ? (
                    <div
                      onDoubleClick={() => handleRemoveFromSlot(idx)}
                      onClick={() => handleRemoveFromSlot(idx)}
                      className="aspect-video rounded-lg overflow-hidden bg-slate-900 border border-indigo-200 relative group cursor-pointer"
                    >
                      <img src={slotUrl} alt={`Placed Step ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        Click / Tap to Remove
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
              ))}
            </div>
          </div>

          {/* SECTION 2: FLOATING IMAGES POOL */}
          <div className="card p-6 bg-slate-900 border-slate-800 text-white shadow-xl">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Floating Images Pool ({pool.length} remaining)
            </h3>

            {pool.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                All images placed into order boxes! Click "Submit Final Sequence" below when ready.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pool.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedUrl(item.url)}
                    onDragEnd={() => setDraggedUrl(null)}
                    onClick={() => handleAssignToSlot(item.url)}
                    onDoubleClick={() => handleAssignToSlot(item.url)}
                    className="group relative aspect-video rounded-xl overflow-hidden bg-slate-950 border-2 border-slate-700 hover:border-amber-400 cursor-grab active:cursor-grabbing transition-all hover:scale-105 shadow-lg"
                  >
                    <img src={item.url} alt="Floating challenge piece" className="w-full h-full object-cover pointer-events-none" />
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
