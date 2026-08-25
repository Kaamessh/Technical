import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../lib/apiClient';
import { supabaseRealtime } from '../../lib/supabaseRealtime';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  Eye,
  Layers,
  Clock,
  UserX,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface MalpracticeLog {
  id: string;
  team_id: string;
  team_name: string;
  slot_id: string;
  slot_code?: string;
  event_id?: string;
  round_number?: number;
  action_type: 'TAB_SWITCH' | 'DEVTOOLS_SHORTCUT' | 'RIGHT_CLICK_INSPECT' | 'DEVTOOLS_OPENED' | 'UNAUTHORIZED_ACTION';
  details: string;
  timestamp: string;
}

interface SlotItem {
  id: string;
  slot_number: number;
  slot_code: string;
  status: string;
}

export const AdminMalpractice: React.FC = () => {
  const [logs, setLogs] = useState<MalpracticeLog[]>([]);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('ALL');
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [clearing, setClearing] = useState<boolean>(false);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get('/events');
      setEvents(res.data);
      if (res.data.length > 0 && !selectedEventId) {
        setSelectedEventId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchSlots = async () => {
    if (!selectedEventId) return;
    try {
      const res = await apiClient.get(`/slots/event/${selectedEventId}`);
      setSlots(res.data);
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/security/logs', {
        params: {
          event_id: selectedEventId || undefined,
          slot_id: selectedSlotId !== 'ALL' ? selectedSlotId : undefined,
        },
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching malpractice logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchSlots();
      fetchLogs();
    }
  }, [selectedEventId, selectedSlotId]);

  // Real-time listener for live malpractice alerts
  useEffect(() => {
    const channels = slots.map((s) => {
      const ch = supabaseRealtime
        .channel(`slot:${s.id}`)
        .on('broadcast', { event: 'malpractice:incident' }, (payload: any) => {
          if (payload?.payload) {
            setLogs((prev) => {
              // Avoid duplicate by ID
              if (prev.some((l) => l.id === payload.payload.id)) return prev;
              return [payload.payload, ...prev];
            });
          }
        })
        .subscribe();
      return ch;
    });

    return () => {
      channels.forEach((ch) => supabaseRealtime.removeChannel(ch));
    };
  }, [slots]);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all malpractice logs? This action cannot be undone.')) {
      return;
    }
    setClearing(true);
    try {
      await apiClient.delete('/security/logs/clear', {
        data: { slot_id: selectedSlotId !== 'ALL' ? selectedSlotId : undefined },
      });
      setLogs([]);
    } catch (err) {
      console.error('Error clearing malpractice logs:', err);
    } finally {
      setClearing(false);
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Slot filter
      if (selectedSlotId !== 'ALL' && log.slot_id !== selectedSlotId) {
        return false;
      }
      // Action type filter
      if (selectedActionType !== 'ALL' && log.action_type !== selectedActionType) {
        return false;
      }
      // Search query (team name or details)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = log.team_name?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        const matchSlot = log.slot_code?.toLowerCase().includes(q);
        if (!matchName && !matchDetails && !matchSlot) return false;
      }
      return true;
    });
  }, [logs, selectedSlotId, selectedActionType, searchQuery]);

  // Grouped stats by team
  const teamViolationStats = useMemo(() => {
    const map = new Map<string, { team_id: string; team_name: string; slot_code: string; count: number; actions: Record<string, number>; latest: string }>();
    logs.forEach((log) => {
      const key = log.team_id || log.team_name;
      const current = map.get(key) || {
        team_id: log.team_id,
        team_name: log.team_name,
        slot_code: log.slot_code || 'N/A',
        count: 0,
        actions: {},
        latest: log.timestamp,
      };
      current.count += 1;
      current.actions[log.action_type] = (current.actions[log.action_type] || 0) + 1;
      if (new Date(log.timestamp) > new Date(current.latest)) {
        current.latest = log.timestamp;
      }
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [logs]);

  // Summary Metrics
  const totalIncidents = logs.length;
  const flaggedTeamsCount = teamViolationStats.length;
  const tabSwitchesCount = logs.filter((l) => l.action_type === 'TAB_SWITCH').length;
  const inspectAttemptsCount = logs.filter((l) => l.action_type !== 'TAB_SWITCH').length;

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) +
        ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'TAB_SWITCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Eye className="w-3.5 h-3.5" /> Tab Switch / Blur
          </span>
        );
      case 'DEVTOOLS_SHORTCUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <Zap className="w-3.5 h-3.5" /> DevTools Shortcut (F12/Ctrl+Shift+I)
          </span>
        );
      case 'RIGHT_CLICK_INSPECT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <ShieldAlert className="w-3.5 h-3.5" /> Right Click Inspect
          </span>
        );
      case 'DEVTOOLS_OPENED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-rose-600/15 text-rose-700 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Inspect Panel Open
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            <ShieldAlert className="w-3.5 h-3.5" /> {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Anti-Cheat Security Center
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Realtime Monitor
            </span>
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Malpractice Monitoring Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Real-time tracking of tab switching, window blurring, DevTools shortcuts, and inspect attempts during event gameplay.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {events.length > 1 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 shadow-xs focus:ring-2 focus:ring-rose-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleClearLogs}
            disabled={clearing || logs.length === 0}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-rose-500 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Incidents
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{totalIncidents}</p>
          <span className="text-[11px] text-slate-400 font-medium">Logged across all slots</span>
        </div>

        <div className="card p-5 border-l-4 border-l-rose-600 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Flagged Teams
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600 mt-2">{flaggedTeamsCount}</p>
          <span className="text-[11px] text-slate-400 font-medium">Teams with violations</span>
        </div>

        <div className="card p-5 border-l-4 border-l-amber-500 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tab Switches
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 mt-2">{tabSwitchesCount}</p>
          <span className="text-[11px] text-slate-400 font-medium">Tab / blur infractions</span>
        </div>

        <div className="card p-5 border-l-4 border-l-purple-500 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Inspect / DevTools
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-600 mt-2">{inspectAttemptsCount}</p>
          <span className="text-[11px] text-slate-400 font-medium">Shortcuts & Right-clicks</span>
        </div>
      </div>

      {/* Flagged Teams Overview (Highlighted in RED) */}
      {teamViolationStats.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserX className="w-5 h-5 text-rose-600" />
              Flagged Teams Summary ({teamViolationStats.length})
            </h3>
            <span className="text-xs text-rose-600 font-bold">
              Highlighted in Red as Requested
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {teamViolationStats.map((team) => (
              <div
                key={team.team_id || team.team_name}
                className="bg-rose-50/70 border-2 border-rose-300 hover:border-rose-400 rounded-2xl p-4 shadow-xs transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      !
                    </div>
                    <div>
                      {/* TEAM NAME IN BOLD RED */}
                      <h4 className="text-base font-extrabold text-rose-700 tracking-tight leading-tight">
                        {team.team_name}
                      </h4>
                      <span className="text-[11px] font-mono text-rose-500 font-bold">
                        {team.slot_code}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-xs shadow-xs">
                    {team.count} {team.count === 1 ? 'Violation' : 'Violations'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-rose-200/80 flex flex-wrap items-center gap-1.5">
                  {Object.entries(team.actions).map(([act, cnt]) => (
                    <span
                      key={act}
                      className="px-2 py-0.5 rounded bg-white text-rose-800 text-[10px] font-extrabold border border-rose-200"
                    >
                      {act.replace('_', ' ')}: {cnt}
                    </span>
                  ))}
                </div>

                <div className="mt-2 text-[10px] text-rose-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Latest infraction: {formatDateTime(team.latest)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card p-4 bg-white shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by team name or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 text-xs py-2 w-full font-medium"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Slot Filter */}
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 shadow-xs focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">All Slots</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  Slot {s.slot_number} ({s.slot_code})
                </option>
              ))}
            </select>

            {/* Action Type Filter */}
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 shadow-xs focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">All Infraction Types</option>
              <option value="TAB_SWITCH">Tab Switch / Blur</option>
              <option value="DEVTOOLS_SHORTCUT">DevTools Shortcuts (F12)</option>
              <option value="RIGHT_CLICK_INSPECT">Right Click Context Menu</option>
              <option value="DEVTOOLS_OPENED">Inspect Panel Open</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incident Log Table */}
      <div className="card overflow-hidden bg-white shadow-xs border border-slate-200">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Live Incident Stream ({filteredLogs.length} entries)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Auto-syncing via Supabase Realtime
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
            Loading malpractice logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No Malpractice Detected</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No tab switching or DevTools inspection attempts recorded for the selected criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-5">Flagged Team</th>
                  <th className="p-3.5">Slot / Event</th>
                  <th className="p-3.5">Infraction Type</th>
                  <th className="p-3.5">What The Member Did</th>
                  <th className="p-3.5">Active Round</th>
                  <th className="p-3.5 pr-5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log, idx) => (
                  <tr
                    key={log.id || idx}
                    className="hover:bg-rose-50/40 transition-colors duration-150"
                  >
                    {/* TEAM NAME IN BOLD RED */}
                    <td className="p-3.5 pl-5 font-black text-rose-600 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="tracking-tight hover:underline cursor-default">
                          {log.team_name}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 font-bold text-slate-700">
                      <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                        {log.slot_code || 'SLOT'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {getActionBadge(log.action_type)}
                    </td>

                    <td className="p-3.5 text-slate-800 font-semibold max-w-xs">
                      {log.details}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                        Round {log.round_number || 1}
                      </span>
                    </td>

                    <td className="p-3.5 pr-5 font-mono text-slate-500 text-[11px]">
                      {formatDateTime(log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
