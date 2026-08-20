import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Database, CheckCircle2, XCircle, Sparkles, Send } from 'lucide-react';

interface DataQuestion {
  id: string;
  question_text: string;
  options: any; // Can be { headers: string[], rows: string[][] } or string[]
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
  const [binaryClue, setBinaryClue] = useState<string | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  const fetchQuestion = () => {
    setLoading(true);
    apiClient
      .get('/gameplay/round4/question')
      .then((res) => {
        if (res.data.completed) {
          if (res.data.decode_hint) {
            setDecodePair(res.data.decode_hint);
            setBinaryClue(res.data.binary_clue || null);
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

  const handleSubmit = async (indexToSubmit?: number) => {
    const rowToSubmit = indexToSubmit !== undefined ? indexToSubmit : selectedIndex;
    if (!question || submitting || isAnswered || rowToSubmit === null || rowToSubmit === undefined) return;

    setSubmitting(true);
    setFeedback(null);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await apiClient.post('/gameplay/round4/answer', {
        question_id: question.id,
        selected_index: rowToSubmit,
        time_taken: timeTaken,
      });

      const actualCorrectIdx = res.data.correct_option_index !== undefined
        ? res.data.correct_option_index
        : (res.data.correct ? rowToSubmit : null);

      setCorrectIndex(actualCorrectIdx);
      setIsAnswered(true);

      if (res.data.correct) {
        setTriggerConfetti(true);
        setFeedback({
          message: '🎉 SPOT ON! ANOMALOUS DATA ROW IDENTIFIED SUCCESSFULLY!',
          type: 'success',
        });
      } else {
        setFeedback({
          message: '❌ INCORRECT SELECTION! THE ACTUAL ANOMALOUS ROW IS HIGHLIGHTED IN GREEN BELOW.',
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

  // Keyboard shortcut: Press Enter to submit selected row
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedIndex !== null && !isAnswered && !submitting) {
        handleSubmit(selectedIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, isAnswered, submitting]);

  const handleDismissDecode = () => {
    setShowDecode(false);
    navigate('/team/round-5');
  };

  // Parse table headers & rows
  const opts = question?.options;
  const isTableObject = opts && typeof opts === 'object' && !Array.isArray(opts) && opts.headers;
  const headers: string[] = isTableObject ? opts.headers : ['Option Text'];
  const rows: string[][] = isTableObject ? opts.rows : (opts || []).map((o: string) => [o]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {triggerConfetti && <ConfettiEffect />}
      {showDecode && (
        <DecodePopup roundNumber={4} pairNumbers={decodePair} binaryClue={binaryClue} onDismiss={handleDismissDecode} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            ROUND 4 OF 5 — SPOT THE DATA ANOMALY
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" /> Interactive Data Table Challenge
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {question?.question_number && (
            <span className="text-xs font-mono font-extrabold bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              TABLE {question.question_number} / {question.total_questions}
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
        <div className="card text-center py-12 text-slate-400 font-bold">Loading interactive data table...</div>
      ) : !question ? (
        <div className="card text-center py-12 text-slate-400 font-bold">No table question available.</div>
      ) : (
        <div className="card p-6 shadow-2xl border-slate-200 space-y-6">
          {/* Question Scenario & Task Instruction */}
          <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1 font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> ANOMALY DETECTION SCENARIO
              </span>
              <p className="text-base font-extrabold leading-relaxed text-slate-100">{question.question_text}</p>
            </div>
            <div className="shrink-0 text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              Click a row or hit <strong>Enter</strong> to confirm
            </div>
          </div>

          {/* Interactive Neon Data Table UI */}
          <div className="overflow-x-auto border-2 border-indigo-900/60 rounded-2xl shadow-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-indigo-200 font-black border-b-2 border-indigo-800 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-12 text-center">Row</th>
                  {headers.map((h, idx) => (
                    <th key={idx} className="py-3.5 px-4 border-l border-indigo-900/60 font-mono">
                      {h}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 w-28 text-center border-l border-indigo-900/60">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => {
                  const isSelected = selectedIndex === rowIdx;
                  const isCorrectRow = rowIdx === correctIndex;

                  let rowStyle = 'border-b border-indigo-950 hover:bg-indigo-950/40 cursor-pointer transition-colors';
                  let badgeText = 'Mark';
                  let badgeStyle = 'bg-indigo-950 text-indigo-300 border-indigo-700 group-hover:bg-indigo-600 group-hover:text-white';
                  let Icon = null;

                  if (isAnswered) {
                    if (isCorrectRow) {
                      // CORRECT ANOMALOUS ROW -> GREEN HIGHLIGHT
                      rowStyle = 'border-b-2 border-emerald-500 bg-emerald-950/90 text-emerald-100 font-extrabold shadow-lg shadow-emerald-500/20 scale-[1.005]';
                      badgeText = '✔ ANOMALY';
                      badgeStyle = 'bg-emerald-600 text-white font-black border-emerald-500';
                      Icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 inline shrink-0 ml-1" />;
                    } else if (isSelected && !isCorrectRow) {
                      // WRONG SELECTED ROW -> RED HIGHLIGHT
                      rowStyle = 'border-b-2 border-rose-500 bg-rose-950/90 text-rose-100 font-extrabold shadow-lg shadow-rose-500/20 scale-[1.005]';
                      badgeText = '❌ WRONG';
                      badgeStyle = 'bg-rose-600 text-white font-black border-rose-500';
                      Icon = <XCircle className="w-4 h-4 text-rose-400 inline shrink-0 ml-1" />;
                    } else {
                      rowStyle = 'border-b border-slate-900 bg-slate-950/50 text-slate-500 opacity-40';
                      badgeStyle = 'bg-slate-900 text-slate-600 border-slate-800';
                    }
                  } else if (isSelected) {
                    // SELECTED BEFORE SUBMIT -> VIBRANT BLUE HIGHLIGHT
                    rowStyle = 'border-b-2 border-indigo-500 bg-indigo-900/80 text-white font-extrabold shadow-lg shadow-indigo-500/30 scale-[1.005]';
                    badgeText = 'Selected';
                    badgeStyle = 'bg-indigo-600 text-white font-extrabold border-indigo-400';
                  }

                  return (
                    <tr
                      key={rowIdx}
                      onClick={() => {
                        if (!isAnswered && !submitting) {
                          setSelectedIndex(rowIdx);
                        }
                      }}
                      className={`group transition-all ${rowStyle}`}
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {rowIdx + 1}
                      </td>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="py-3 px-4 border-l border-indigo-950/60 font-medium">
                          {cell}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center border-l border-indigo-950/60">
                        <button
                          type="button"
                          disabled={submitting || isAnswered}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAnswered && !submitting) {
                              setSelectedIndex(rowIdx);
                            }
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border shadow-2xs ${badgeStyle}`}
                        >
                          {badgeText} {Icon}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Action bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
              {selectedIndex !== null ? (
                <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  Selected: <strong>Row {selectedIndex + 1}</strong>
                </span>
              ) : (
                <span className="text-slate-400">Click any row in the table above to mark your selection.</span>
              )}
            </div>

            <button
              type="button"
              disabled={submitting || isAnswered || selectedIndex === null}
              onClick={() => handleSubmit(selectedIndex!)}
              className="btn-primary px-8 py-3 font-extrabold text-sm gap-2 disabled:opacity-40 w-full sm:w-auto shadow-lg"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Confirm & Submit Answer (Enter)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
