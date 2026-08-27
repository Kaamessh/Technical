import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { CheckCircle2, AlertCircle, XCircle, Sparkles, HelpCircle } from 'lucide-react';
import { useSlotTimer } from '../../context/SlotTimerContext';

export const Round1Quiz: React.FC = () => {
  const navigate = useNavigate();
  const { syncTimer } = useSlotTimer();

  const [question, setQuestion] = useState<any>(null);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(1);
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

  const fetchQuestion = useCallback(async () => {
    if (showDecode) return;
    try {
      const res = await apiClient.get('/gameplay/round1/current');

      if (res.data.timer?.started_at) {
        syncTimer(res.data.timer.started_at, res.data.timer.duration_seconds);
      }

      if (res.data.completed) {
        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else {
          navigate('/team/round-2');
        }
        return;
      }

      if (res.data.id) {
        setQuestion(res.data);
        setQuestionNumber(res.data.question_number || 1);
        setTotalQuestions(res.data.total_questions || 1);
        setSelectedIndex(null);
        setCorrectIndex(null);
        setIsAnswered(false);
        setIsCorrect(null);
        setFeedback(null);
      }
    } catch (err: any) {
      console.error('Error fetching round 1 question:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate, syncTimer, showDecode]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const handleSubmit = async (index: number) => {
    if (!question || submitting || isAnswered) return;

    setSelectedIndex(index);
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await apiClient.post('/gameplay/round1/answer', {
        question_id: question.id,
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
          message: `🎉 SPOT ON! CORRECT ANSWER! +10 PTS!`,
          type: 'success',
        });
      } else {
        setIsCorrect(false);
        setFeedback({
          message: `❌ WRONG CHOICE! THE CORRECT ANSWER IS HIGHLIGHTED IN GREEN BELOW.`,
          type: 'error',
        });
      }

      // Snappy 0.8s transition delay so team can see the verified answer
      setTimeout(() => {
        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else if (res.data.completed) {
          navigate('/team/round-2');
        } else {
          fetchQuestion();
        }
      }, 800);
    } catch (err: any) {
      console.error(err);
      fetchQuestion();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissDecode = () => {
    setShowDecode(false);
    navigate('/team/round-2');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      {triggerConfetti && <ConfettiEffect />}
      {showDecode && (
        <DecodePopup roundNumber={1} pairNumbers={decodePair} onDismiss={handleDismissDecode} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            ROUND 1 OF 5 — MCQ KNOWLEDGE QUIZ
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-indigo-600" /> AI Knowledge Arena
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
        <div className="card text-center py-12 text-slate-400 font-bold">Loading question...</div>
      ) : !question ? (
        <div className="card text-center py-16 px-6 border-indigo-100 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-inner">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            PREPARING ROUND 1 QUESTIONS
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 font-medium">
            Waiting for slot questions to load...
          </p>
        </div>
      ) : (
        <div className="card p-8 border-indigo-100 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-4">
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 uppercase font-mono tracking-wider">
              QUESTION {questionNumber} OF {totalQuestions}
            </span>
            <span className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 font-mono text-[10px] uppercase tracking-wider">
              ⚡ 10 PTS PER CORRECT ANSWER
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
                  // CORRECT ANSWER -> GREEN
                  buttonStyle = 'border-emerald-600 bg-emerald-600 text-white font-extrabold shadow-lg shadow-emerald-200 scale-[1.02]';
                  badgeStyle = 'bg-emerald-800 text-white font-black';
                  IconComponent = <CheckCircle2 className="w-6 h-6 text-white shrink-0" />;
                } else if (idx === selectedIndex && !isCorrect) {
                  // WRONG SELECTED ANSWER -> RED
                  buttonStyle = 'border-rose-600 bg-rose-600 text-white font-extrabold shadow-lg shadow-rose-200 scale-[1.02]';
                  badgeStyle = 'bg-rose-800 text-white font-black';
                  IconComponent = <XCircle className="w-6 h-6 text-white shrink-0" />;
                } else {
                  buttonStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                  badgeStyle = 'bg-slate-200 text-slate-400';
                }
              } else if (selectedIndex === idx) {
                buttonStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900';
              }

              const isDisabled = submitting || isAnswered;

              return (
                <button
                  key={idx}
                  onClick={() => handleSubmit(idx)}
                  disabled={isDisabled}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${buttonStyle} ${
                    isDisabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'
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
            <span>Solo MCQ: Each member answers questions independently</span>
            <span>Progress: {questionNumber}/{totalQuestions}</span>
          </div>
        </div>
      )}
    </div>
  );
};
