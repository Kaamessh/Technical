import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { supabaseRealtime } from '../../lib/supabaseRealtime';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import {
  FolderGit2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  Unlock,
  Copy,
  Check,
  Tag,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface CardItem {
  id: string;
  card_index: number;
  card_number: number;
  claimed: boolean;
  is_claimed_by_you: boolean;
  team_name?: string;
  title?: string;
  description?: string;
  category?: string;
}

interface ClaimedProblem {
  id: string;
  card_number: number;
  title: string;
  description: string;
  category: string;
}

export const Round6ProblemSelection: React.FC = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [myProblem, setMyProblem] = useState<ClaimedProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingIndex, setClaimingIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchCards = async () => {
    try {
      const res = await apiClient.get('/gameplay/round6/cards');
      setCards(res.data.cards || []);
      setHasClaimed(!!res.data.has_claimed);
      if (res.data.my_problem) {
        setMyProblem(res.data.my_problem);
      }
    } catch (err: any) {
      console.error('Error fetching round 6 cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // Realtime subscription to slot updates
  useEffect(() => {
    if (!user?.slot_id) return;

    const channel = supabaseRealtime.channel(`slot:${user.slot_id}`);

    channel
      .on('broadcast', { event: 'problem:claimed' }, (payload) => {
        console.log('Realtime problem claimed event:', payload);
        const data = payload.payload;
        if (data) {
          setCards((prev) =>
            prev.map((c) => {
              if (c.id === data.card_id || c.card_index === data.card_index) {
                const isMe = data.team_id === user.id;
                return {
                  ...c,
                  claimed: true,
                  is_claimed_by_you: isMe,
                  team_name: data.team_name,
                };
              }
              return c;
            })
          );

          if (data.team_id !== user.id) {
            setFeedback({
              message: `Card #${data.card_number || data.card_index + 1} was just claimed by ${data.team_name || 'another team'}.`,
              type: 'info',
            });
          }
        }
      })
      .subscribe();

    // Auto-poll sync every 2.5s as fallback
    const interval = setInterval(fetchCards, 2500);

    return () => {
      supabaseRealtime.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user?.slot_id, user?.id]);

  const handleClaimCard = async (card: CardItem) => {
    if (hasClaimed || card.claimed || claimingIndex !== null) return;

    setClaimingIndex(card.card_index);
    setFeedback(null);

    try {
      const res = await apiClient.post('/gameplay/round6/claim', {
        card_id: card.id,
        card_index: card.card_index,
      });

      if (res.data.success) {
        setTriggerConfetti(true);
        setHasClaimed(true);
        setMyProblem(res.data.problem);
        setFeedback({
          message: '🎉 Congratulations! Your problem statement has been assigned successfully!',
          type: 'success',
        });
        fetchCards();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to claim card. Please try another card.';
      setFeedback({ message: errMsg, type: 'error' });
      fetchCards();
    } finally {
      setClaimingIndex(null);
    }
  };

  const handleCopyText = () => {
    if (!myProblem) return;
    const textToCopy = `Problem: ${myProblem.title}\nCategory: ${myProblem.category}\n\nDescription:\n${myProblem.description}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {triggerConfetti && <ConfettiEffect />}

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" /> ROUND 6 — PROBLEM STATEMENT SELECTION
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
          Claim Your Challenge
        </h1>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          Choose a mystery card below to reveal and lock in your team's assigned problem statement.
          Each team claims exactly 1 statement (no points awarded).
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-2xl font-semibold text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Assigned Problem Statement Hero Banner (if claimed) */}
      {myProblem && (
        <div className="mb-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-lg">
                CARD #{myProblem.card_number} ASSIGNED
              </span>
              <span className="px-3 py-1 bg-slate-800 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-700 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {myProblem.category}
              </span>
            </div>

            <button
              onClick={handleCopyText}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Statement'}
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wide mb-4">
            {myProblem.title}
          </h2>

          <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 backdrop-blur-sm">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">
              Problem Description & Requirements:
            </h4>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
              {myProblem.description}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-amber-400/90 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>This problem statement has been permanently assigned to <strong>{user?.team_name || user?.name || 'Your Team'}</strong>. Good luck with your project development!</span>
          </div>
        </div>
      )}

      {/* Cards Grid Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-indigo-600" /> Selection Pool ({cards.length} Cards)
        </h3>
        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
          </span>
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Claimed
          </span>
        </div>
      </div>

      {/* Cards Grid (3 cards per row) */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 font-medium">
          Loading problem statement cards...
        </div>
      ) : cards.length === 0 ? (
        <div className="card text-center py-16 text-slate-500 font-medium">
          No problem statement cards configured for this event slot. Please contact the administrator.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cards.map((card) => {
            const isMe = card.is_claimed_by_you;
            const isOther = card.claimed && !isMe;
            const isAvailable = !card.claimed;
            const isCurrentlyClaiming = claimingIndex === card.card_index;

            return (
              <div
                key={card.id || card.card_index}
                onClick={() => {
                  if (isAvailable && !hasClaimed) {
                    handleClaimCard(card);
                  }
                }}
                className={`relative rounded-3xl p-6 transition-all duration-200 border-2 flex flex-col justify-between min-h-[260px] select-none ${
                  isMe
                    ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 cursor-default'
                    : isOther
                    ? 'bg-slate-950 border-rose-600/60 opacity-80 cursor-not-allowed shadow-inner'
                    : hasClaimed
                    ? 'bg-slate-900 border-slate-700 opacity-60 cursor-not-allowed'
                    : 'bg-slate-900 border-emerald-500/70 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 cursor-pointer active:scale-98'
                }`}
              >
                {/* Top status indicator */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black px-3 py-1 rounded-xl bg-slate-800 text-slate-300 font-mono">
                    CARD #{card.card_number}
                  </span>

                  {isMe ? (
                    <span className="px-3 py-1 bg-amber-400 text-slate-950 text-[11px] font-black uppercase rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> YOURS
                    </span>
                  ) : isOther ? (
                    <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold uppercase rounded-lg flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" /> CLAIMED
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase rounded-lg flex items-center gap-1 animate-pulse">
                      <Unlock className="w-3.5 h-3.5" /> AVAILABLE
                    </span>
                  )}
                </div>

                {/* Center Content */}
                <div className="my-auto text-center py-4">
                  {isMe ? (
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <h4 className="text-lg font-black text-amber-300 line-clamp-2">
                        {card.title || myProblem?.title || 'Assigned Statement'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {card.category || myProblem?.category || 'Project Challenge'}
                      </p>
                    </div>
                  ) : isOther ? (
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-500">
                        <XCircle className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-extrabold text-rose-400 uppercase tracking-wider">
                        Unavailable
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Claimed by: <span className="text-white font-bold">{card.team_name || 'Team'}</span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                        <Lock className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-extrabold text-white">
                        Mystery Problem Card
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 font-sans">
                        {hasClaimed
                          ? 'You have already selected a statement'
                          : 'Click to reveal & permanently claim'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Action / Indicator */}
                <div className="pt-4 border-t border-slate-800/80 text-center">
                  {isMe ? (
                    <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Assigned to Your Team
                    </span>
                  ) : isOther ? (
                    <span className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Taken by Another Team
                    </span>
                  ) : isCurrentlyClaiming ? (
                    <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" /> Claiming Card...
                    </span>
                  ) : hasClaimed ? (
                    <span className="text-xs font-bold text-slate-500">
                      Selection Completed
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
                    >
                      CLAIM THIS CARD
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
