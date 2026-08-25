import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/apiClient';

interface MalpracticeAlert {
  id: string;
  type: string;
  message: string;
  timestamp: number;
}

export function useAntiMalpractice(activeRoundNumber?: number) {
  const { user } = useAuth();
  const location = useLocation();
  const [warningAlert, setWarningAlert] = useState<MalpracticeAlert | null>(null);
  const lastReportTimeRef = useRef<Record<string, number>>({});

  // Determine if active user is a team in an active challenge round
  const isMember = user?.role === 'team';
  const isGameRoute =
    location.pathname.startsWith('/team/round-') ||
    location.pathname === '/team/play';

  const reportIncident = async (
    actionType: 'TAB_SWITCH' | 'DEVTOOLS_SHORTCUT' | 'RIGHT_CLICK_INSPECT' | 'DEVTOOLS_OPENED' | 'UNAUTHORIZED_ACTION',
    details: string
  ) => {
    if (!isMember || !isGameRoute || !user?.id) return;

    // Rate-limit reporting per action type (max once every 3 seconds per category)
    const now = Date.now();
    const lastReport = lastReportTimeRef.current[actionType] || 0;
    if (now - lastReport < 3000) return;
    lastReportTimeRef.current[actionType] = now;

    // Show instant warning banner to the member
    setWarningAlert({
      id: String(now),
      type: actionType,
      message: details,
      timestamp: now,
    });

    // Auto-dismiss warning after 4.5 seconds
    setTimeout(() => {
      setWarningAlert((prev) => (prev?.timestamp === now ? null : prev));
    }, 4500);

    // Send incident to backend
    try {
      await apiClient.post('/security/report', {
        team_id: user.id,
        team_name: user.team_name || user.name,
        slot_id: user.slot_id,
        round_number: activeRoundNumber || 1,
        action_type: actionType,
        details,
      });
    } catch (err) {
      console.warn('Failed to dispatch malpractice incident:', err);
    }
  };

  useEffect(() => {
    if (!isMember || !isGameRoute) return;

    // 1. Tab Switching & Window Blur Detection
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        reportIncident('TAB_SWITCH', 'Switched browser tab or minimized window');
      }
    };

    const handleWindowBlur = () => {
      reportIncident('TAB_SWITCH', 'Navigated away or clicked outside browser window');
    };

    // 2. DevTools Keyboard Shortcuts Detection
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        reportIncident('DEVTOOLS_SHORTCUT', 'Pressed F12 Developer Tools shortcut');
        return false;
      }

      // Ctrl+Shift+I / Cmd+Option+I (Inspect)
      if (isCtrlOrCmd && (e.shiftKey || e.altKey) && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
        reportIncident('DEVTOOLS_SHORTCUT', 'Attempted Ctrl+Shift+I / DevTools Inspect shortcut');
        return false;
      }

      // Ctrl+Shift+J / Cmd+Option+J (Console)
      if (isCtrlOrCmd && (e.shiftKey || e.altKey) && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
        reportIncident('DEVTOOLS_SHORTCUT', 'Attempted Ctrl+Shift+J / Console shortcut');
        return false;
      }

      // Ctrl+Shift+C / Cmd+Option+C (Element Inspect)
      if (isCtrlOrCmd && (e.shiftKey || e.altKey) && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
        reportIncident('DEVTOOLS_SHORTCUT', 'Attempted Ctrl+Shift+C Element Selector shortcut');
        return false;
      }

      // Ctrl+U / Cmd+Option+U (View Source)
      if (isCtrlOrCmd && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
        reportIncident('DEVTOOLS_SHORTCUT', 'Attempted Ctrl+U / View Page Source');
        return false;
      }
    };

    // 3. Right Click / Context Menu Interception
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportIncident('RIGHT_CLICK_INSPECT', 'Attempted Right Click Context Menu (Inspect Element)');
      return false;
    };

    // 4. DevTools Open Heuristic Check
    let devToolsOpenCount = 0;
    const checkDevToolsDimensions = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      if (widthThreshold || heightThreshold) {
        devToolsOpenCount++;
        if (devToolsOpenCount === 1) {
          reportIncident('DEVTOOLS_OPENED', 'Browser Developer Tools / Inspect panel opened');
        }
      } else {
        devToolsOpenCount = 0;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu);
    const devToolsInterval = setInterval(checkDevToolsDimensions, 2000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(devToolsInterval);
    };
  }, [isMember, isGameRoute, user?.id, user?.slot_id, activeRoundNumber]);

  return { warningAlert, setWarningAlert };
}
