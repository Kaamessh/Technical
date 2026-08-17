import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { resolveImageUrl } from '../../lib/imageUtils';
import { Timer } from '../../components/Timer';
import { DecodePopup } from '../../components/DecodePopup';
import { ConfettiEffect } from '../../components/ConfettiEffect';
import { Sparkles, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface AIChallenge {
  id: string;
  image_a_url: string;
  image_b_url: string;
  question_number?: number;
  total_questions?: number;
}

export const Round3AiOrReal: React.FC = () => {
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState<AIChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null);
  const [correctSide, setCorrectSide] = useState<'A' | 'B' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Decode popup
  const [showDecode, setShowDecode] = useState(false);
  const [decodePair, setDecodePair] = useState<number[] | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  const fetchChallenge = () => {
    setLoading(true);
    apiClient
      .get('/gameplay/round3/challenge')
      .then((res) => {
        if (res.data.completed) {
          if (res.data.decode_hint) {
            setDecodePair(res.data.decode_hint);
            setShowDecode(true);
          } else {
            navigate('/team/round-4');
          }
        } else {
          setChallenge(res.data);
          setStartTime(Date.now());
          setSelectedSide(null);
          setCorrectSide(null);
          setIsAnswered(false);

          // Fast Image Preloading in background
          if (res.data.image_a_url) {
            const imgA = new Image();
            imgA.src = resolveImageUrl(res.data.image_a_url);
          }
          if (res.data.image_b_url) {
            const imgB = new Image();
            imgB.src = resolveImageUrl(res.data.image_b_url);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        navigate('/team/round-4');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchChallenge();
  }, []);

  const handleSubmit = async (side: 'A' | 'B') => {
    if (!challenge || submitting || isAnswered) return;
    setSelectedSide(side);
    setSubmitting(true);
    setFeedback(null);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await apiClient.post('/gameplay/round3/submit', {
        challenge_id: challenge.id,
        selected_side: side,
        time_taken: timeTaken,
      });

      const actualRightSide = res.data.correct_side || (res.data.correct ? side : (side === 'A' ? 'B' : 'A'));
      setCorrectSide(actualRightSide);
      setIsAnswered(true);

      if (res.data.correct) {
        setTriggerConfetti(true);
        setFeedback({
          message: `🎉 SPOT ON! CORRECT AI SYNTHETIC IMAGE IDENTIFIED! +${res.data.points || 10} PTS!`,
          type: 'success',
        });
      } else {
        setFeedback({
          message: `❌ WRONG CHOICE! YOUR SELECTION WAS A REAL IMAGE. THE CORRECT AI IMAGE IS HIGHLIGHTED IN GREEN BELOW.`,
          type: 'error',
        });
      }

      // Fast 2-second feedback delay so team can see their result
      setTimeout(() => {
        if (res.data.decode_hint) {
          setDecodePair(res.data.decode_hint);
          setShowDecode(true);
        } else if (res.data.completed) {
          navigate('/team/round-4');
        } else {
          fetchChallenge();
        }
      }, 2000);
    } catch (err: any) {
      console.error(err);
      fetchChallenge();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissDecode = () => {
    setShowDecode(false);
    navigate('/team/round-4');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {triggerConfetti && <ConfettiEffect />}
      {showDecode && (
        <DecodePopup roundNumber={3} pairNumbers={decodePair} onDismiss={handleDismissDecode} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            ROUND 3 OF 5 — AI OR REAL DETECTION
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600 animate-spin" /> Spot the Synthetic AI Image
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {challenge?.question_number && (
            <span className="text-xs font-mono font-extrabold bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              PAIR {challenge.question_number} / {challenge.total_questions}
            </span>
          )}
          <Timer isCountUp={true} isActive={!loading && !!challenge && !isAnswered} />
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

      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-xs font-semibold text-indigo-900 mb-6 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>Examine both high-resolution image options below. Click on the image option you believe is <strong>AI-GENERATED</strong>!</span>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-slate-400">Loading AI vs Real image challenge...</div>
      ) : !challenge ? (
        <div className="card text-center py-12 text-slate-400">No challenge pair available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['A', 'B'] as const).map((side) => {
            const url = side === 'A' ? challenge.image_a_url : challenge.image_b_url;
            const fullUrl = resolveImageUrl(url);

            let cardContainerStyle = 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xl';
            let badgeStyle = 'bg-slate-900/80 text-white';
            let IconComponent = null;

            if (isAnswered) {
              if (side === correctSide) {
                // CORRECT AI IMAGE -> ALWAYS HIGHLIGHTED IN GREEN
                cardContainerStyle = 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/30 shadow-2xl scale-[1.02]';
                badgeStyle = 'bg-emerald-600 text-white font-extrabold';
                IconComponent = <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
              } else if (side === selectedSide && side !== correctSide) {
                // WRONG SELECTED IMAGE -> HIGHLIGHTED IN RED
                cardContainerStyle = 'border-rose-500 bg-rose-50 ring-4 ring-rose-500/30 shadow-2xl scale-[1.02]';
                badgeStyle = 'bg-rose-600 text-white font-extrabold';
                IconComponent = <XCircle className="w-6 h-6 text-rose-500" />;
              } else {
                cardContainerStyle = 'border-slate-200 bg-slate-50 opacity-60';
                badgeStyle = 'bg-slate-300 text-slate-600';
              }
            }

            return (
              <div
                key={side}
                onClick={() => handleSubmit(side)}
                className={`card p-4 border-2 transition-all cursor-pointer group flex flex-col justify-between ${cardContainerStyle}`}
              >
                <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 mb-4 border border-slate-200">
                  <img
                    src={fullUrl}
                    alt={`Option ${side}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="eager"
                  />
                  <span className={`absolute top-2 left-2 text-xs font-mono font-extrabold px-3 py-1 rounded-lg backdrop-blur-xs transition-colors ${badgeStyle}`}>
                    OPTION {side}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    {isAnswered && side === correctSide && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ✔ SYNTHETIC AI IMAGE
                      </span>
                    )}
                    {isAnswered && side === selectedSide && side !== correctSide && (
                      <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                        ❌ REAL PHOTOGRAPH
                      </span>
                    )}
                    {!isAnswered && `Select Option ${side}`}
                  </span>

                  {IconComponent || (
                    <span className="text-xs font-extrabold text-indigo-600 group-hover:translate-x-1 transition-transform">
                      Choose {side} →
                    </span>
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
