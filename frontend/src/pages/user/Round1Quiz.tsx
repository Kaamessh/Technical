import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { supabaseRealtime } from '../../lib/supabaseRealtime';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Radio, CheckCircle2, AlertCircle, Lock, XCircle } from 'lucide-react';

export const Round1Quiz: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<any>(null);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [sequenceOrder, setSequenceOrder] = useState<number>(1);
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
  const [countdown, setCountdown] = useState<number | null>(null);

  const [waitingForNext, setWaitingForNext] = useState(false);

  const fetchCurrentQuestion = async () => {
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

      if (res.data.waiting_for_next) {
        setWaitingForNext(true);
        setQuestion(null);
      } else {
        setWaitingForNext(false);
        setQueueId(res.data.queue_id);
        setSequenceOrder(res.data.sequence_order);
        setQuestion(res.data.question);
        setSelectedIndex(null);
        setCorrectIndex(null);
        setIsAnswered(false);
        setIsCorrect(null);
      }

      if (res.data.sequence_order === 1 && res.data.live_started_at) {
        const startedAt = new Date(res.data.live_started_at).getTime();
        const elapsed = Date.now() - startedAt;
        if (elapsed < 5000) {
          setCountdown(Math.ceil((5000 - elapsed) / 1000));
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    fetchCurrentQuestion();

    if (!user?.slot_id) return;

    // Supabase Realtime channel subscription
    const channel = supabaseRealtime.channel(`slot:${user.slot_id}`);

    channel
      .on('broadcast', { event: 'question:live' }, (payload) => {
        console.log('Realtime Question Live:', payload);
        setFeedback({ message: '⚡ NEW LIVE QUESTION BROADCAST!', type: 'info' });
        fetchCurrentQuestion();
      })
      .on('broadcast', { event: 'question:won' }, (payload) => {
        if (payload.payload?.won_by_team_id !== user.id) {
          setFeedback({
            message: `⚠️ Question won by ${payload.payload?.team_name || 'another team'}! Loading next question...`,
            type: 'error',
          });
        }
        fetchCurrentQuestion();
      })
      .subscribe();

    // Fallback polling interval every 2.5 seconds when waiting for next question
    const pollInterval = setInterval(() => {
      fetchCurrentQuestion();
    }, 2500);

    return () => {
      supabaseRealtime.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user?.slot_id]);

  const handleSubmit = async (index: number) => {
    if (!queueId || submitting || isAnswered) return;
    setSelectedIndex(index);
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await apiClient.post('/gameplay/round1/answer', {
        queue_id: queueId,
        selected_index: index,
      });

      const correctAnsIdx = res.data.correct_option_index !== undefined ? res.data.correct_option_index : (res.data.correct ? index : null);
      setCorrectIndex(correctAnsIdx);
      setIsAnswered(true);
      setIsCorrect(res.data.correct);

      if (res.data.correct) {
        setTriggerConfetti(true);
        setFeedback({
          message: `🎉 CONGRATULATIONS! YOUR ANSWER IS RIGHT! +${res.data.points || 0} PTS AWARDED!`,
          type: 'success',
        });
      } else {
        setFeedback({
          message: `❌ WRONG ANSWER! YOUR SELECTION WAS INCORRECT. THE RIGHT ANSWER IS HIGHLIGHTED IN GREEN BELOW.`,
          type: 'error',
        });
      }

      // Delay transition by 2.5 seconds so team can view answer result clearly
      setTimeout(() => {
        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else if (res.data.completed) {
          navigate('/team/round-2');
        } else if (res.data.waiting_for_next || !res.data.correct) {
          setWaitingForNext(true);
          setQuestion(null);
        } else {
          fetchCurrentQuestion();
        }
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setWaitingForNext(true);
      setQuestion(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissDecode = () => {
    setShowDecode(false);
    navigate('/team/round-2');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {triggerConfetti && <ConfettiEffect />}
      {showDecode && (
        <DecodePopup roundNumber={1} pairNumbers={decodePair} onDismiss={handleDismissDecode} />
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

        <Timer isCountUp={true} isActive={!!question && (countdown === null || countdown <= 0) && !isAnswered} />
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
        <div className="card text-center py-12 text-slate-400">Synchronizing live question...</div>
      ) : !question ? (
        <div className="card text-center py-12">
          <Lock className={`w-12 h-12 mx-auto mb-3 ${waitingForNext ? 'text-amber-500 animate-pulse' : 'text-slate-300'}`} />
          <h3 className="text-lg font-bold text-slate-800">
            {waitingForNext ? 'Attempt Recorded — Waiting for Next Question' : 'Waiting for Question Broadcast'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {waitingForNext
              ? 'Your choice for this question was recorded. Waiting for the question to conclude or next broadcast...'
              : 'The event organizer will trigger live question queue for your slot.'}
          </p>
        </div>
      ) : countdown !== null && countdown > 0 ? (
        <div className="card text-center py-20 border-indigo-200 shadow-xl bg-indigo-50">
          <h2 className="text-4xl font-extrabold text-indigo-900 mb-4 animate-pulse">Game Starting In...</h2>
          <div className="text-8xl font-black text-indigo-600 font-mono">{countdown}</div>
        </div>
      ) : (
        <div className="card p-8 border-indigo-100 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-4">
            <span>QUESTION {sequenceOrder}</span>
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              FIRST CORRECT FINISH ADVANCES
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
                if (idx === correctIndex) {
                  // CORRECT ANSWER -> ALWAYS HIGHLIGHTED IN GREEN
                  buttonStyle = 'border-emerald-600 bg-emerald-600 text-white font-extrabold shadow-lg shadow-emerald-200 scale-[1.02]';
                  badgeStyle = 'bg-emerald-800 text-white font-black';
                  IconComponent = <CheckCircle2 className="w-6 h-6 text-white shrink-0" />;
                } else if (idx === selectedIndex && idx !== correctIndex) {
                  // WRONG SELECTED ANSWER -> HIGHLIGHTED IN RED
                  buttonStyle = 'border-rose-600 bg-rose-600 text-white font-extrabold shadow-lg shadow-rose-200 scale-[1.02]';
                  badgeStyle = 'bg-rose-800 text-white font-black';
                  IconComponent = <XCircle className="w-6 h-6 text-white shrink-0" />;
                } else {
                  // OTHER UNSELECTED OPTIONS -> DIMMED
                  buttonStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                  badgeStyle = 'bg-slate-200 text-slate-400';
                }
              } else if (selectedIndex === idx) {
                buttonStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900';
              }

              return (
                <button
                  key={idx}
                  disabled={submitting || isAnswered}
                  onClick={() => handleSubmit(idx)}
                  className={`p-5 rounded-xl border-2 text-left font-bold text-sm transition-all flex items-center justify-between group ${buttonStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold transition-colors ${badgeStyle}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{optionText}</span>
                  </div>
                  {IconComponent}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
