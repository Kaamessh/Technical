import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Database, CheckCircle2, XCircle } from 'lucide-react';

interface DataQuestion {
  id: string;
  question_text: string;
  options: string[];
  question_number?: number;
  total_questions?: number;
}

export const Round4DataChallenge: React.FC = () => {
  const navigate = useNavigate();

  const [question, setQuestion] = useState<DataQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Decode popup
  const [showDecode, setShowDecode] = useState(false);
  const [decodePair, setDecodePair] = useState<number[] | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  const fetchQuestion = () => {
    setLoading(true);
    apiClient
      .get('/gameplay/round4/question')
      .then((res) => {
        if (res.data.completed) {
          if (res.data.decode_hint) {
            setDecodePair(res.data.decode_hint);
            setShowDecode(true);
          } else {
            navigate('/team/round-5');
          }
        } else {
          setQuestion(res.data);
          setStartTime(Date.now());
          setSelectedIndex(null);
          setCorrectIndex(null);
          setIsAnswered(false);
        }
      })
      .catch((err) => {
        console.error(err);
        navigate('/team/round-5');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleSubmit = async (index: number) => {
    if (!question || submitting || isAnswered) return;
    setSelectedIndex(index);
    setSubmitting(true);
    setFeedback(null);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await apiClient.post('/gameplay/round4/answer', {
        question_id: question.id,
        selected_index: index,
        time_taken: timeTaken,
      });

      const actualCorrectIdx = res.data.correct_option_index !== undefined
        ? res.data.correct_option_index
        : (res.data.correct ? index : null);

      setCorrectIndex(actualCorrectIdx);
      setIsAnswered(true);

      if (res.data.correct) {
        setTriggerConfetti(true);
        setFeedback({
          message: '🎉 CORRECT! DATA ANOMALY DETECTED SUCCESSFULLY!',
          type: 'success',
        });
      } else {
        setFeedback({
          message: '❌ INCORRECT SELECTION! THE CORRECT ANSWER IS HIGHLIGHTED IN GREEN BELOW.',
          type: 'error',
        });
      }

      setTimeout(() => {
        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else if (res.data.completed) {
          navigate('/team/round-5');
        } else {
          fetchQuestion();
        }
      }, 2000);
    } catch (err: any) {
      console.error(err);
      fetchQuestion();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissDecode = () => {
    setShowDecode(false);
    navigate('/team/round-5');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {triggerConfetti && <ConfettiEffect />}
      {showDecode && (
        <DecodePopup roundNumber={4} pairNumbers={decodePair} onDismiss={handleDismissDecode} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            ROUND 4 OF 5 — DATA ANOMALY CHALLENGE
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" /> Spot the Data Anomaly
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {question?.question_number && (
            <span className="text-xs font-mono font-extrabold bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              QUESTION {question.question_number} / {question.total_questions}
            </span>
          )}
          <Timer isCountUp={true} isActive={!loading && !!question && !isAnswered} />
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl font-extrabold text-sm flex items-center gap-2.5 shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500 text-white border-2 border-emerald-600'
              : 'bg-rose-500 text-white border-2 border-rose-600'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-6 h-6 shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 shrink-0" />
          )}
          <span className="text-sm font-extrabold tracking-wide">{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div className="card text-center py-12 text-slate-400">Loading data challenge...</div>
      ) : !question ? (
        <div className="card text-center py-12 text-slate-400">No question available.</div>
      ) : (
        <div className="card p-8 shadow-xl border-slate-200 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-2 font-mono">
              ANOMALY SCENARIO
            </span>
            <p className="text-base font-extrabold leading-relaxed text-slate-100">{question.question_text}</p>
          </div>

          <div className="space-y-3">
            {question.options.map((option, idx) => {
              let buttonStyle = 'border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/40 text-slate-800';
              let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
              let IconComponent = null;

              if (isAnswered) {
                if (idx === correctIndex) {
                  buttonStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-extrabold ring-4 ring-emerald-500/30 scale-[1.01]';
                  badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                  IconComponent = <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
                } else if (idx === selectedIndex && idx !== correctIndex) {
                  buttonStyle = 'border-rose-500 bg-rose-50 text-rose-950 font-extrabold ring-4 ring-rose-500/30 scale-[1.01]';
                  badgeStyle = 'bg-rose-600 text-white border-rose-600';
                  IconComponent = <XCircle className="w-5 h-5 text-rose-600" />;
                } else {
                  buttonStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSubmit(idx)}
                  disabled={submitting || isAnswered}
                  className={`w-full p-4 rounded-xl border-2 text-left font-bold text-sm transition-all flex items-center justify-between gap-4 ${buttonStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-mono font-black shrink-0 ${badgeStyle}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm leading-snug">{option}</span>
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
