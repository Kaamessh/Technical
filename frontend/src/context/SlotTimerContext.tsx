import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { apiClient } from '../lib/apiClient';
import { supabaseRealtime } from '../lib/supabaseRealtime';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';

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
  const [isStarted, setIsStarted] = useState<boolean>(true);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [showExpiredModal, setShowExpiredModal] = useState<boolean>(false);

  // Sync Timer from API / Realtime
  const syncTimer = useCallback(
    (startedAtIso: string | null, duration: number = DEFAULT_DURATION) => {
      const startIso = startedAtIso || new Date().toISOString();
      setStartedAt(startIso);
      setDurationSeconds(duration);
      localStorage.setItem(`slot_started_${slotKey}`, startIso);
      localStorage.setItem(`slot_duration_${slotKey}`, String(duration));
    },
    [slotKey]
  );

  // Automatic self-start if on game round and startedAt is missing
  useEffect(() => {
    if (user?.role === 'team' && location.pathname.startsWith('/team/round-')) {
      if (!startedAt) {
        const nowIso = new Date().toISOString();
        syncTimer(nowIso, DEFAULT_DURATION);
      }
    }
  }, [user?.role, location.pathname, startedAt, syncTimer]);

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
        } else if (!startedAt) {
          syncTimer(new Date().toISOString(), DEFAULT_DURATION);
        }
      })
      .catch(() => {
        if (!startedAt) {
          syncTimer(new Date().toISOString(), DEFAULT_DURATION);
        }
      });

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
        const startTime = payload?.payload?.start_time || new Date().toISOString();
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

  // High-performance local 1-second interval calculation (zero network overhead)
  useEffect(() => {
    const effectiveStart = startedAt || new Date().toISOString();
    const startMs = new Date(effectiveStart).getTime();
    const validStartMs = isNaN(startMs) ? Date.now() : startMs;

    setIsStarted(true);

    const updateRemaining = () => {
      const elapsedSec = Math.floor((Date.now() - validStartMs) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsedSec);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        setIsExpired(true);
        // Only show modal on active game pages
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
