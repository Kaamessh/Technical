import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { supabaseRealtime } from '../../lib/supabaseRealtime';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Radio, CheckCircle2, AlertCircle, Lock, XCircle, Sparkles, Zap } from 'lucide-react';
import { useSlotTimer } from '../../context/SlotTimerContext';

export const Round1Quiz: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { syncTimer } = useSlotTimer();

  const [question, setQuestion] = useState<any>(null);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [sequenceOrder, setSequenceOrder] = useState<number>(1);
  const [liveStartedAt, setLiveStartedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Decode popup state
  const [showDecode, setShowDecode] = useState(false);
  const [decodePair, setDecodePair] = useState<number[] | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Synchronized 3-2-1 Server Countdown State
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchCurrentQuestion = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await apiClient.get('/gameplay/round1/current');

      if (res.data.completed) {
        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else {
          navigate('/team/round-2');
        }
        return;
      }

      if (res.data.timer?.started_at) {
        syncTimer(res.data.timer.started_at, res.data.timer.duration_seconds);
      }

      if (res.data.waiting_for_next) {
        setWaitingForNext(true);
        setQuestion(null);
        setCountdownRemaining(null);
      } else if (res.data.question) {
        setWaitingForNext(false);
        setQueueId(res.data.queue_id);
        setSequenceOrder(res.data.sequence_order);
        setLiveStartedAt(res.data.live_started_at || null);
        setQuestion(res.data.question);

        // Check if countdown is currently running
        if (res.data.live_started_at) {
          const targetMs = new Date(res.data.live_started_at).getTime();
          const diffSec = Math.ceil((targetMs - Date.now()) / 1000);
          if (diffSec > 0) {
            setCountdownRemaining(diffSec);
          } else {
            setCountdownRemaining(null);
          }
        } else {
          setCountdownRemaining(null);
        }
      }
    } catch (err: any) {
      // If error or unassigned, show waiting lobby gracefully
      setWaitingForNext(true);
      setQuestion(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [navigate, syncTimer]);

  // Synchronized 3-2-1 Countdown Ticker
  useEffect(() => {
    if (!liveStartedAt) return;

    const tickCountdown = () => {
      const targetMs = new Date(liveStartedAt).getTime();
      const diffMs = targetMs - Date.now();
      const secondsLeft = Math.ceil(diffMs / 1000);

      if (secondsLeft > 0) {
        setCountdownRemaining(secondsLeft);
      } else if (secondsLeft === 0) {
        setCountdownRemaining(0);
        setTimeout(() => {
          setCountdownRemaining(null);
        }, 500);
      } else {
        setCountdownRemaining(null);
      }
    };

    tickCountdown();
    const ticker = setInterval(tickCountdown, 250);
    return () => clearInterval(ticker);
  }, [liveStartedAt]);

  // Stable 500ms Auto-Sync Polling Loop
  useEffect(() => {
    fetchCurrentQuestion();
    const interval = setInterval(fetchCurrentQuestion, 500);
    return () => clearInterval(interval);
  }, [fetchCurrentQuestion]);

  // Supabase Realtime Broadcast Listener
  useEffect(() => {
    if (!user?.slot_id) return;

    const channelName = `slot:${user.slot_id}`;
    const channel = supabaseRealtime
      .channel(channelName)
      .on('broadcast', { event: 'round:start_countdown' }, (payload) => {
        const startTime = payload.payload?.start_time;
        if (startTime) {
          setLiveStartedAt(startTime);
          syncTimer(startTime, payload.payload?.duration_seconds || 1200);
        }
        fetchCurrentQuestion();
      })
      .on('broadcast', { event: 'question:live' }, (payload) => {
        if (payload.payload?.start_time) {
          setLiveStartedAt(payload.payload.start_time);
          syncTimer(payload.payload.start_time, payload.payload?.duration_seconds || 1200);
        }
        fetchCurrentQuestion();
      })
      .on('broadcast', { event: 'question:won' }, (payload) => {
        if (payload.payload?.won_by_team_id !== user.id) {
          setFeedback({
            message: `⚠️ Question won by ${payload.payload?.team_name || 'another team'}! Transitioning...`,
            type: 'error',
          });
        }
        fetchCurrentQuestion();
      })
      .subscribe();

    return () => {
      supabaseRealtime.removeChannel(channel);
    };
  }, [user?.slot_id, fetchCurrentQuestion, syncTimer]);

  const handleSubmit = async (index: number) => {
    // Prevent answering while countdown is still active
    if (!queueId || submitting || isAnswered || countdownRemaining !== null) return;

    setSelectedIndex(index);
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await apiClient.post('/gameplay/round1/answer', {
        queue_id: queueId,
        selected_index: index,
      });

      const correctAnsIdx =
        res.data.correct_option_index !== undefined
          ? res.data.correct_option_index
          : res.data.correct
          ? index
          : null;
      setCorrectIndex(correctAnsIdx);
      setIsAnswered(true);

      if (res.data.correct) {
        setIsCorrect(true);
        setTriggerConfetti(true);
        setFeedback({
          message: `🎉 CONGRATULATIONS! YOU WERE THE FIRST TO ANSWER CORRECTLY! +100 PTS!`,
          type: 'success',
        });

        setTimeout(() => {
          if (res.data.decode_hint) {
            setDecodePair(res.data.decode_hint);
            setShowDecode(true);
          } else if (res.data.completed) {
            navigate('/team/round-2');
          } else {
            fetchCurrentQuestion();
          }
        }, 1000);
      } else if (res.data.won_by_other) {
        setIsCorrect(false);
        setFeedback({
          message: `⚠️ QUESTION WON BY ANOTHER TEAM! TRANSITIONING TO NEXT QUESTION...`,
          type: 'error',
        });

        setTimeout(() => {
          if (res.data.decode_hint) {
            setDecodePair(res.data.decode_hint);
            setShowDecode(true);
          } else if (res.data.completed) {
            navigate('/team/round-2');
          } else {
            fetchCurrentQuestion();
          }
        }, 800);
      } else {
        // INCORRECT SELECTION
        setIsCorrect(false);
        setFeedback({
          message: `❌ WRONG ANSWER! YOUR SELECTION WAS INCORRECT. THE RIGHT ANSWER IS HIGHLIGHTED IN GREEN BELOW.`,
          type: 'error',
        });

        setTimeout(() => {
          if (res.data.decode_hint) {
            setDecodePair(res.data.decode_hint);
            setShowDecode(true);
          } else if (res.data.completed) {
            navigate('/team/round-2');
          } else {
            fetchCurrentQuestion();
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      fetchCurrentQuestion();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissDecode = () => {
    setShowDecode(false);
    navigate('/team/round-2');
  };

  const isCountdownActive = countdownRemaining !== null && countdownRemaining >= 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      {triggerConfetti && <ConfettiEffect />}
      {showDecode && (
        <DecodePopup roundNumber={1} pairNumbers={decodePair} onDismiss={handleDismissDecode} />
      )}

      {/* SYNCHRONIZED 3-2-1 START COUNTDOWN OVERLAY */}
      {isCountdownActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center text-white animate-fade-in p-6">
          <div className="max-w-md w-full text-center space-y-6 bg-slate-900/90 p-8 rounded-3xl border-2 border-indigo-500/40 shadow-2xl animate-in zoom-in-95 duration-200">
            <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-4 py-1.5 rounded-full border border-indigo-800/80 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" /> SYNCHRONIZING ARENA START
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-100 uppercase">
              GET READY!
            </h2>
            <div className="text-8xl sm:text-9xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-indigo-400 to-emerald-400 animate-bounce py-2">
              {countdownRemaining === 0 ? 'START!' : countdownRemaining}
            </div>
            <p className="text-xs text-slate-400 font-bold tracking-wide">
              First team to answer correctly claims the points!
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            ROUND 1 OF 5 — LIVE QUIZ
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <Radio className="w-6 h-6 text-emerald-500 animate-pulse" /> Speed Answer Arena
          </h1>
        </div>

        <Timer />
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl font-bold text-sm flex items-center gap-2.5 shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500 text-white border-2 border-emerald-600'
              : feedback.type === 'error'
              ? 'bg-rose-500 text-white border-2 border-rose-600'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-6 h-6 shrink-0" />
          ) : feedback.type === 'error' ? (
            <XCircle className="w-6 h-6 shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 shrink-0" />
          )}
          <span className="text-sm font-extrabold tracking-wide">{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-slate-400 font-bold">Synchronizing live question...</div>
      ) : !question ? (
        <div className="card text-center py-16 px-6 border-indigo-100 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-inner">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            SLOT WAITING LOBBY
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 font-medium">
            {waitingForNext
              ? 'Your response was recorded. Waiting for the event organizer to broadcast the next live question...'
              : 'You have joined the slot. Waiting for the event organizer to start Round 1 live quiz...'}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Auto-Sync Active (Live updates on admin start — No refresh needed)</span>
          </div>
        </div>
      ) : (
        <div className="card p-8 border-indigo-100 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-4">
            <span>QUESTION {sequenceOrder}</span>
            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 font-mono text-[10px] uppercase tracking-wider">
              ⚡ FIRST CORRECT ANSWER WINS
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 mb-8 leading-snug">
            {question.question_text}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(question.options as string[]).map((optionText, idx) => {
              let buttonStyle = 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50 text-slate-800';
              let badgeStyle = 'bg-slate-100 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white';
              let IconComponent = null;

              if (isAnswered) {
                if (idx === correctIndex && isCorrect) {
                  // FIRST CORRECT CLAIMER -> HIGHLIGHTED IN GREEN
                  buttonStyle = 'border-emerald-600 bg-emerald-600 text-white font-extrabold shadow-lg shadow-emerald-200 scale-[1.02]';
                  badgeStyle = 'bg-emerald-800 text-white font-black';
                  IconComponent = <CheckCircle2 className="w-6 h-6 text-white shrink-0" />;
                } else if (idx === selectedIndex && !isCorrect) {
                  // WRONG SELECTED ANSWER -> HIGHLIGHTED IN RED
                  buttonStyle = 'border-rose-600 bg-rose-600 text-white font-extrabold shadow-lg shadow-rose-200 scale-[1.02]';
                  badgeStyle = 'bg-rose-800 text-white font-black';
                  IconComponent = <XCircle className="w-6 h-6 text-white shrink-0" />;
                } else if (idx === correctIndex && !isCorrect) {
                  buttonStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                  badgeStyle = 'bg-emerald-600 text-white';
                } else {
                  buttonStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                  badgeStyle = 'bg-slate-200 text-slate-400';
                }
              } else if (selectedIndex === idx) {
                buttonStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900';
              }

              const isDisabled = submitting || isAnswered || isCountdownActive;

              return (
                <button
                  key={idx}
                  onClick={() => handleSubmit(idx)}
                  disabled={isDisabled}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${buttonStyle} ${
                    isDisabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${badgeStyle}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-bold text-sm leading-relaxed">{optionText}</span>
                  </div>

                  {IconComponent}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Speed is factor: Click fastest to claim +100 PTS</span>
            </span>
            <span>Single attempt allowed per question</span>
          </div>
        </div>
      )}
    </div>
  );
};
