import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { supabaseRealtime } from '../../lib/supabaseRealtime';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Radio, Zap, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export const Round1Quiz: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<any>(null);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [sequenceOrder, setSequenceOrder] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Decode popup state
  const [showDecode, setShowDecode] = useState(false);
  const [decodePair, setDecodePair] = useState<number[] | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

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

      setQueueId(res.data.queue_id);
      setSequenceOrder(res.data.sequence_order);
      setQuestion(res.data.question);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        setTimeout(() => fetchCurrentQuestion(), 1500);
      })
      .subscribe();

    return () => {
      supabaseRealtime.removeChannel(channel);
    };
  }, [user?.slot_id]);

  const handleSubmit = async (index: number) => {
    if (!queueId || submitting) return;
    setSelectedIndex(index);
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await apiClient.post('/gameplay/round1/answer', {
        queue_id: queueId,
        selected_index: index,
      });

      if (res.data.correct && res.data.won) {
        setTriggerConfetti(true);
        setFeedback({ message: `🏆 FIRST CORRECT ANSWER! +${res.data.points} PTS AWARDED!`, type: 'success' });
        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else {
          setTimeout(() => navigate('/team/round-2'), 2500);
        }
      } else {
        setFeedback({ message: res.data.message || 'Incorrect answer. Try again!', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ message: err.response?.data?.error || 'Submission error', type: 'error' });
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

        <Timer isCountUp={true} />
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl font-bold text-sm flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-slate-400">Synchronizing live question...</div>
      ) : !question ? (
        <div className="card text-center py-12">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Waiting for Question Broadcast</h3>
          <p className="text-xs text-slate-500">The event organizer will trigger live question queue for your slot.</p>
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
            {(question.options as string[]).map((optionText, idx) => (
              <button
                key={idx}
                disabled={submitting}
                onClick={() => handleSubmit(idx)}
                className={`p-5 rounded-xl border-2 text-left font-bold text-sm transition-all flex items-center justify-between group ${
                  selectedIndex === idx
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{optionText}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
