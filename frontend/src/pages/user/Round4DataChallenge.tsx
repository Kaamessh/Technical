import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Database, CheckCircle2, AlertCircle } from 'lucide-react';

export const Round4DataChallenge: React.FC = () => {
  const navigate = useNavigate();

  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState<number>(Date.now());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Decode popup
  const [showDecode, setShowDecode] = useState(false);
  const [decodePair, setDecodePair] = useState<number[] | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  useEffect(() => {
    apiClient
      .get('/gameplay/round4/question')
      .then((res) => {
        setQuestion(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (index: number) => {
    if (!question || submitting) return;
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

      if (res.data.correct) {
        setTriggerConfetti(true);
        setFeedback({ message: `📊 DATA ANOMALY SPOT ON! +${res.data.points} PTS AWARDED!`, type: 'success' });
        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else {
          setTimeout(() => navigate('/team/round-5'), 2500);
        }
      } else {
        setFeedback({ message: res.data.message || 'Incorrect choice. Re-read the scenario!', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ message: err.response?.data?.error || 'Submission error', type: 'error' });
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
            ROUND 4 OF 5 — SPOT THE DATA ANOMALY
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-600" /> Data Analytics Challenge
          </h1>
        </div>

        <Timer isCountUp={true} />
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
        <div className="card text-center py-12 text-slate-400">Loading data challenge...</div>
      ) : !question ? (
        <div className="card text-center py-12 text-slate-400">No data question configured.</div>
      ) : (
        <div className="card p-8 border-indigo-100 shadow-lg">
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
