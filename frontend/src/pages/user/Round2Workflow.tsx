import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { CheckCircle2, AlertCircle, ArrowDown, Shuffle, Sparkles, Layers } from 'lucide-react';

interface StepItem {
  id: string;
  label: string;
}

export const Round2Workflow: React.FC = () => {
  const navigate = useNavigate();

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [totalSlots, setTotalSlots] = useState<number>(6);

  // All scattered pool items fetched from backend: [{ id: 'step-0', label: '📸 Capture' }, ...]
  const [allItems, setAllItems] = useState<StepItem[]>([]);
  // Placed slots array: (string | null)[] storing placed step labels
  const [placedSlots, setPlacedSlots] = useState<(string | null)[]>([]);

  const [loading, setLoading] = useState(true);
  const [startTime] = useState<number>(Date.now());
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Decode popup state
  const [showDecode, setShowDecode] = useState(false);
  const [decodePair, setDecodePair] = useState<number[] | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  const fetchChallenge = () => {
    setLoading(true);
    apiClient
      .get('/gameplay/round2/challenge')
      .then((res) => {
        if (res.data.completed) {
          navigate('/team/round-3');
          return;
        }
        setChallengeId(res.data.id);
        setTitle(res.data.title || 'Workflow Sequence Puzzle');
        const numSlots = res.data.total_slots || 6;
        setTotalSlots(numSlots);

        const items: StepItem[] = res.data.items || [];
        setAllItems(items);
        setPlacedSlots(new Array(numSlots).fill(null));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchChallenge();
  }, []);

  // Derived placed step labels (non-null)
  const placedLabelsSet = new Set(placedSlots.filter((label): label is string => label !== null));

  // Available unplaced cards in the side pools
  const availablePoolItems = allItems.filter((item) => !placedLabelsSet.has(item.label));

  // Split available pool cards into Left and Right pools for scattered 3D layout
  const halfLength = Math.ceil(availablePoolItems.length / 2);
  const leftPoolItems = availablePoolItems.slice(0, halfLength);
  const rightPoolItems = availablePoolItems.slice(halfLength);

  // Place item into first empty target slot or specified slot
  const handlePlaceCard = (label: string, targetSlotIdx?: number) => {
    setFeedback(null);
    setPlacedSlots((prevSlots) => {
      const next = [...prevSlots];

      // If card is already placed in a slot, clear its old slot
      const existingIdx = next.indexOf(label);
      if (existingIdx !== -1) {
        next[existingIdx] = null;
      }

      if (targetSlotIdx !== undefined && targetSlotIdx >= 0 && targetSlotIdx < next.length) {
        next[targetSlotIdx] = label;
      } else {
        // Place in first empty slot
        const emptyIdx = next.indexOf(null);
        if (emptyIdx !== -1) {
          next[emptyIdx] = label;
        }
      }
      return next;
    });
  };

  // Remove card from slot and return to pool
  const handleRemoveFromSlot = (slotIdx: number) => {
    setFeedback(null);
    setPlacedSlots((prevSlots) => {
      const next = [...prevSlots];
      next[slotIdx] = null;
      return next;
    });
  };

  // Shuffle remaining pool cards
  const handleShufflePool = () => {
    setAllItems((prevItems) => [...prevItems].sort(() => 0.5 - Math.random()));
  };

  const handleSubmit = async () => {
    if (!challengeId || submitting) return;

    // Check if all target slots are filled
    const isAllSlotsFilled = placedSlots.every((label) => label !== null);
    if (!isAllSlotsFilled) {
      setFeedback({
        message: `Please fill all ${totalSlots} workflow slots before checking!`,
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await apiClient.post('/gameplay/round2/submit', {
        challenge_id: challengeId,
        submitted_labels: placedSlots,
        time_taken: timeTaken,
      });

      if (res.data.correct) {
        setTriggerConfetti(true);
        setFeedback({ message: '✔ Great Job! Keep Going!', type: 'success' });

        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else {
          setTimeout(() => navigate('/team/round-3'), 2000);
        }
      } else {
        setFeedback({
          message: res.data.message || '❗ Oops! Try Again! Check your step sequence or remove distractor steps.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setFeedback({ message: err.response?.data?.error || 'Verification error', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissDecode = () => {
    setShowDecode(false);
    navigate('/team/round-3');
  };

  const filledCount = placedSlots.filter((label) => label !== null).length;
  const progressPercent = Math.round((filledCount / totalSlots) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 font-sans">
      {triggerConfetti && <ConfettiEffect />}
      {showDecode && (
        <DecodePopup roundNumber={2} pairNumbers={decodePair} onDismiss={handleDismissDecode} />
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            ROUND 2 OF 5 — WORKFLOW PUZZLE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-600" /> {title || 'Data Science Workflow Puzzle'}
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1">
            Drag or click the steps into the correct flow order from top to bottom!
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress Indicator */}
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs text-right">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">Progress</div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs font-mono font-black text-slate-800">{filledCount}/{totalSlots}</span>
            </div>
          </div>

          <Timer isCountUp={true} isActive={!loading && !!challengeId} />
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-16 text-slate-400">Loading workflow puzzle board...</div>
      ) : (
        <div className="rounded-3xl bg-slate-950 p-6 shadow-2xl border-4 border-slate-900 text-white relative overflow-hidden">
          {/* GAME BOARD TOP BANNER */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-6 border-b border-slate-800/80 gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-sm font-extrabold text-slate-200 uppercase tracking-wide">
                Arrange {totalSlots} Real Steps in Correct Order
              </span>
            </div>

            <button
              onClick={handleShufflePool}
              className="text-xs font-extrabold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-400" /> Shuffle Cards
            </button>
          </div>

          {/* MAIN 3-COLUMN PUZZLE LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* LEFT SCATTERED POOL */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider text-center lg:text-left mb-2">
                Available Steps ({leftPoolItems.length})
              </h3>
              {leftPoolItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handlePlaceCard(item.label)}
                  className="card-3d bg-white text-slate-900 p-3.5 rounded-2xl border-2 border-slate-200 shadow-lg hover:border-indigo-500 hover:scale-[1.03] cursor-pointer transition-all active:scale-95 flex items-center justify-between group"
                >
                  <span className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md opacity-80 group-hover:opacity-100">
                    + Place
                  </span>
                </div>
              ))}
            </div>

            {/* CENTER TARGET WORKFLOW COLUMN */}
            <div className="lg:col-span-2 space-y-2 bg-slate-900/60 p-5 rounded-2xl border-2 border-slate-800 shadow-inner">
              <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-widest text-center mb-4 flex items-center justify-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" /> Target Flow Sequence ({totalSlots} Steps)
              </h3>

              {placedSlots.map((slotLabel, idx) => (
                <React.Fragment key={idx}>
                  <div className="relative">
                    {slotLabel ? (
                      // FILLED SLOT CARD
                      <div
                        onClick={() => handleRemoveFromSlot(idx)}
                        className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm shadow-xl border-2 border-emerald-400 flex items-center justify-between cursor-pointer hover:brightness-110 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-emerald-800/60 text-white flex items-center justify-center text-xs font-mono font-bold border border-emerald-400/40">
                            #{idx + 1}
                          </span>
                          <span className="text-base tracking-tight">{slotLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                          <span className="text-[10px] bg-emerald-800/80 text-emerald-100 px-2 py-0.5 rounded font-mono uppercase group-hover:bg-rose-600 group-hover:text-white transition-colors">
                            Click to Remove
                          </span>
                        </div>
                      </div>
                    ) : (
                      // EMPTY TARGET SLOT DROPZONE
                      <div
                        onClick={() => {
                          const firstAvailable = availablePoolItems[0];
                          if (firstAvailable) handlePlaceCard(firstAvailable.label, idx);
                        }}
                        className="p-4 rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/80 text-slate-400 font-extrabold text-sm flex items-center justify-between hover:border-indigo-400 hover:text-indigo-300 hover:bg-slate-900 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-mono font-bold">
                            #{idx + 1}
                          </span>
                          <span className="text-xs uppercase tracking-widest text-slate-500 font-mono">PLACE STEP HERE</span>
                        </div>
                        <span className="text-[10px] border border-slate-700 px-2 py-0.5 rounded text-slate-500 font-mono">EMPTY</span>
                      </div>
                    )}
                  </div>

                  {/* DOWN ARROW CONNECTOR */}
                  {idx < totalSlots - 1 && (
                    <div className="flex justify-center my-0.5">
                      <ArrowDown className="w-5 h-5 text-indigo-400/70 animate-bounce" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* RIGHT SCATTERED POOL */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider text-center lg:text-left mb-2">
                Available Steps ({rightPoolItems.length})
              </h3>
              {rightPoolItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handlePlaceCard(item.label)}
                  className="card-3d bg-white text-slate-900 p-3.5 rounded-2xl border-2 border-slate-200 shadow-lg hover:border-indigo-500 hover:scale-[1.03] cursor-pointer transition-all active:scale-95 flex items-center justify-between group"
                >
                  <span className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md opacity-80 group-hover:opacity-100">
                    + Place
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM FEEDBACK & VERIFY BUTTON BAR */}
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
            {feedback && (
              <div
                className={`p-4 rounded-xl font-black text-sm flex items-center gap-3 shadow-lg ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500 text-white border-2 border-emerald-400'
                    : 'bg-rose-600 text-white border-2 border-rose-400'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 shrink-0 animate-bounce" />
                )}
                <span className="text-base tracking-wide">{feedback.message}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-accent w-full py-4 text-xl font-black tracking-wider uppercase font-sans shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all"
            >
              {submitting ? 'Verifying Workflow Sequence...' : 'UN-LOCK WORKFLOW FINALE'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
