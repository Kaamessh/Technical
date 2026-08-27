import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { apiClient } from '../lib/apiClient';
import { supabaseRealtime } from '../lib/supabaseRealtime';
import { Clock, AlertTriangle, ArrowRight, Hourglass, Zap, Flame, X } from 'lucide-react';

interface MilestoneAlert {
  id: string;
  minutesRemaining: number;
  title: string;
  badge: string;
  message: string;
  gradient: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  icon: 'clock' | 'hourglass' | 'alert' | 'flame';
}

interface SlotTimerContextType {
  startedAt: string | null;
  durationSeconds: number;
  remainingSeconds: number;
  isStarted: boolean;
  isExpired: boolean;
  formattedTime: string;
  syncTimer: (startedAtIso: string | null, duration?: number) => void;
}

const SlotTimerContext = createContext<SlotTimerContextType | undefined>(undefined);

const DEFAULT_DURATION = 1200; // 20 minutes in seconds

export const SlotTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const slotKey = user?.slot_id || 'default_slot';

  const [startedAt, setStartedAt] = useState<string | null>(() => {
    return localStorage.getItem(`slot_started_${slotKey}`) || null;
  });
  const [durationSeconds, setDurationSeconds] = useState<number>(() => {
    const saved = localStorage.getItem(`slot_duration_${slotKey}`);
    return saved ? Number(saved) : DEFAULT_DURATION;
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number>(DEFAULT_DURATION);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [showExpiredModal, setShowExpiredModal] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<MilestoneAlert | null>(null);

  const shownMilestonesRef = useRef<Set<number>>(new Set());

  // Sync Timer from API / Realtime
  const syncTimer = useCallback(
    (startedAtIso: string | null, duration: number = DEFAULT_DURATION) => {
      if (!startedAtIso) return;
      setStartedAt(startedAtIso);
      setDurationSeconds(duration);
      localStorage.setItem(`slot_started_${slotKey}`, startedAtIso);
      localStorage.setItem(`slot_duration_${slotKey}`, String(duration));
    },
    [slotKey]
  );

  // Clear timer state on slot change or logout
  useEffect(() => {
    if (!user?.slot_id) {
      setStartedAt(null);
      setIsStarted(false);
      setRemainingSeconds(DEFAULT_DURATION);
      shownMilestonesRef.current.clear();
    }
  }, [user?.slot_id]);

  // Fetch initial timer state from team-status
  useEffect(() => {
    if (!user || user.role !== 'team' || !user.slot_id) {
      return;
    }

    let isMounted = true;
    apiClient
      .get('/gameplay/team-status')
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.timer?.started_at) {
          syncTimer(res.data.timer.started_at, res.data.timer.duration_seconds || DEFAULT_DURATION);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user?.slot_id, syncTimer]);

  // Realtime listener for round:start_countdown & slot:timer_sync
  useEffect(() => {
    if (!user || user.role !== 'team' || !user.slot_id) return;

    const channelName = `slot:${user.slot_id}`;
    const channel = supabaseRealtime
      .channel(channelName)
      .on('broadcast', { event: 'round:start_countdown' }, (payload: any) => {
        const count = payload?.payload?.countdown_seconds || 3;
        // Game starts when 3-2-1 countdown finishes
        const gameStartMs = Date.now() + count * 1000;
        const startTime = payload?.payload?.start_time || new Date(gameStartMs).toISOString();
        const duration = payload?.payload?.duration_seconds || DEFAULT_DURATION;
        syncTimer(startTime, duration);
      })
      .on('broadcast', { event: 'question:live' }, (payload: any) => {
        if (payload?.payload?.start_time) {
          syncTimer(payload.payload.start_time, payload.payload.duration_seconds || DEFAULT_DURATION);
        }
      })
      .subscribe();

    return () => {
      supabaseRealtime.removeChannel(channel);
    };
  }, [user?.slot_id, syncTimer]);

  // High-performance local 1-second interval calculation
  useEffect(() => {
    if (!startedAt) {
      setIsStarted(false);
      setRemainingSeconds(durationSeconds);
      return;
    }

    const startMs = new Date(startedAt).getTime();
    if (isNaN(startMs)) {
      setIsStarted(false);
      setRemainingSeconds(durationSeconds);
      return;
    }

    const triggerMilestone = (minutes: number, alertData: MilestoneAlert) => {
      if (!shownMilestonesRef.current.has(minutes)) {
        shownMilestonesRef.current.add(minutes);
        setActiveAlert(alertData);
        // Auto-dismiss after 6.5 seconds
        setTimeout(() => {
          setActiveAlert((curr) => (curr?.minutesRemaining === minutes ? null : curr));
        }, 6500);
      }
    };

    const updateRemaining = () => {
      const now = Date.now();

      // If still within 3-2-1 countdown, hold at full 20:00
      if (now < startMs) {
        setIsStarted(false);
        setRemainingSeconds(durationSeconds);
        return;
      }

      setIsStarted(true);
      const elapsedSec = Math.floor((now - startMs) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsedSec);
      setRemainingSeconds(remaining);

      // --- Every 5-Minute Milestone Alert Check ---
      if (remaining <= 900 && remaining > 880) {
        // 15 Minutes Remaining (5 mins elapsed)
        triggerMilestone(15, {
          id: '15m',
          minutesRemaining: 15,
          title: '15 Minutes Remaining',
          badge: '15:00 REMAINING • 25% ELAPSED',
          message: '5 minutes elapsed! Maintain strong momentum across your active challenges.',
          gradient: 'from-indigo-600 via-indigo-700 to-blue-800',
          borderColor: 'border-indigo-400',
          badgeBg: 'bg-indigo-500/30 border-indigo-300/40',
          badgeText: 'text-indigo-100',
          icon: 'clock',
        });
      } else if (remaining <= 600 && remaining > 580) {
        // 10 Minutes Remaining (10 mins elapsed / Halfway mark)
        triggerMilestone(10, {
          id: '10m',
          minutesRemaining: 10,
          title: '10 Minutes Remaining — Halfway Mark',
          badge: '10:00 REMAINING • 50% ELAPSED',
          message: 'Halfway through the event slot! Ensure your team is moving briskly through the rounds.',
          gradient: 'from-amber-500 via-amber-600 to-orange-700',
          borderColor: 'border-amber-300',
          badgeBg: 'bg-amber-500/30 border-amber-300/40',
          badgeText: 'text-amber-100',
          icon: 'hourglass',
        });
      } else if (remaining <= 300 && remaining > 280) {
        // 5 Minutes Remaining (15 mins elapsed / Final stretch)
        triggerMilestone(5, {
          id: '5m',
          minutesRemaining: 5,
          title: '5 Minutes Remaining — Final Stretch',
          badge: '05:00 REMAINING • 75% ELAPSED',
          message: 'Final 5 minutes! Assemble your decode word clues and solve pending rounds.',
          gradient: 'from-rose-600 via-rose-700 to-red-800',
          borderColor: 'border-rose-300',
          badgeBg: 'bg-rose-500/30 border-rose-300/40',
          badgeText: 'text-rose-100',
          icon: 'flame',
        });
      } else if (remaining <= 60 && remaining > 45) {
        // 1 Minute Remaining (Final warning)
        triggerMilestone(1, {
          id: '1m',
          minutesRemaining: 1,
          title: 'Final 60 Seconds!',
          badge: '01:00 REMAINING • FINAL MINUTE',
          message: 'Session concluding shortly! Submit all active answers before the time limit ends.',
          gradient: 'from-red-600 via-rose-800 to-slate-900',
          borderColor: 'border-red-400',
          badgeBg: 'bg-red-500/40 border-red-300/50',
          badgeText: 'text-white',
          icon: 'alert',
        });
      }

      if (remaining <= 0) {
        setIsExpired(true);
        const isGamePage =
          location.pathname.startsWith('/team/round-') ||
          location.pathname === '/team/play';
        if (isGamePage) {
          setShowExpiredModal(true);
        }
      } else {
        setIsExpired(false);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationSeconds, location.pathname]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveToCompleted = () => {
    setShowExpiredModal(false);
    navigate('/team/completed');
  };

  return (
    <SlotTimerContext.Provider
      value={{
        startedAt,
        durationSeconds,
        remainingSeconds,
        isStarted,
        isExpired,
        formattedTime: formatTime(remainingSeconds),
        syncTimer,
      }}
    >
      {children}

      {/* Attractive Floating 5-Minute Milestone Alert Toast */}
      {activeAlert && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300 shadow-2xl">
          <div
            className={`p-4 rounded-2xl bg-gradient-to-r ${activeAlert.gradient} text-white border-2 ${activeAlert.borderColor} shadow-2xl backdrop-blur-md relative overflow-hidden`}
          >
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-start gap-3.5 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                {activeAlert.icon === 'clock' && <Clock className="w-5 h-5 animate-pulse text-white" />}
                {activeAlert.icon === 'hourglass' && <Hourglass className="w-5 h-5 animate-spin text-white" />}
                {activeAlert.icon === 'flame' && <Flame className="w-5 h-5 animate-bounce text-amber-200" />}
                {activeAlert.icon === 'alert' && <AlertTriangle className="w-5 h-5 animate-ping text-yellow-200" />}
              </div>

              <div className="flex-1 pr-6">
                <span
                  className={`text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${activeAlert.badgeBg} ${activeAlert.badgeText} inline-block mb-1`}
                >
                  {activeAlert.badge}
                </span>

                <h4 className="text-sm font-black text-white leading-tight">
                  {activeAlert.title}
                </h4>

                <p className="text-xs text-white/90 mt-1 leading-relaxed font-medium">
                  {activeAlert.message}
                </p>
              </div>

              <button
                onClick={() => setActiveAlert(null)}
                className="absolute top-3 right-3 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subdued Bottom Progress Track */}
            <div className="mt-3 w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.max(0, Math.min(100, (remainingSeconds / durationSeconds) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Global 20-Minute Time Limit Expiry Modal */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="card max-w-md w-full p-6 text-center shadow-2xl bg-white border-2 border-rose-400 rounded-3xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <span className="text-[11px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 inline-block mb-2">
              Time Limit Reached (20:00)
            </span>

            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Event Time Limit Concluded
            </h3>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              You reached the <strong>20-minute time limit</strong> for this slot.
              All points and completed challenges scored during your session have been calculated and safely locked.
            </p>

            <button
              onClick={handleLeaveToCompleted}
              className="btn-primary w-full py-3.5 font-black text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 rounded-xl cursor-pointer"
            >
              <span>View Final Standings & Results</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </SlotTimerContext.Provider>
  );
};

export const useSlotTimer = (): SlotTimerContextType => {
  const context = useContext(SlotTimerContext);
  if (!context) {
    throw new Error('useSlotTimer must be used within a SlotTimerProvider');
  }
  return context;
};
