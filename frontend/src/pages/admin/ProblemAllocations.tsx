import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import {
  FileText,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  FolderCheck,
  Tag,
  Users,
} from 'lucide-react';

export const ProblemAllocations: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [data, setData] = useState<{
    total_teams: number;
    total_problem_statements: number;
    total_chosen: number;
    total_slots: number;
    allocations: any[];
    all_problem_statements: any[];
  }>({
    total_teams: 0,
    total_problem_statements: 0,
    total_chosen: 0,
    total_slots: 0,
    allocations: [],
    all_problem_statements: [],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [slotFilter, setSlotFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'chosen' | 'pending'>('all');

  useEffect(() => {
    apiClient.get('/events').then((res) => {
      setEvents(res.data);
      if (res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    });
  }, []);

  const fetchAllocations = async (showRefreshIndicator = false) => {
    if (!selectedEventId) return;
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const res = await apiClient.get(`/problem-statements/event/${selectedEventId}/all-allocations`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching problem allocations:', err);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      setLoading(true);
      fetchAllocations();

      // Auto-refresh every 4 seconds for live monitoring
      const interval = setInterval(() => {
        fetchAllocations();
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [selectedEventId]);

  // Unique slot numbers for filter dropdown
  const uniqueSlots = Array.from(
    new Set(
      data.allocations
        .map((a) => a.slot_number)
        .filter((sn) => sn !== null && sn !== undefined)
    )
  ).sort((a: any, b: any) => a - b);

  // Filtered allocations
  const filteredAllocations = data.allocations.filter((item) => {
    const matchesSearch =
      item.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.problem?.problem_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.problem?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.slot_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSlot =
      slotFilter === 'all' || String(item.slot_number) === slotFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'chosen' && item.has_chosen_problem) ||
      (statusFilter === 'pending' && !item.has_chosen_problem);

    return matchesSearch && matchesSlot && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['Team Name', 'Slot #', 'Join Code', 'Status', 'Card #', 'Category', 'Problem Statement Title', 'Description', 'Claimed At'];
    const rows = filteredAllocations.map((a) => [
      `"${a.team_name || ''}"`,
      `"${a.slot_number ? 'Slot #' + a.slot_number : 'Unassigned'}"`,
      `"${a.slot_code || ''}"`,
      `"${a.has_chosen_problem ? 'Chosen' : 'In Progress (Round ' + a.current_round + ')'}"`,
      `"${a.problem ? 'Card #' + a.problem.card_number : 'N/A'}"`,
      `"${a.problem?.category || 'N/A'}"`,
      `"${(a.problem?.problem_title || '').replace(/"/g, '""')}"`,
      `"${(a.problem?.description || '').replace(/"/g, '""')}"`,
      `"${a.problem?.claimed_at ? new Date(a.problem.claimed_at).toLocaleString() : 'N/A'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `problem_statement_allocations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <FolderCheck className="w-3.5 h-3.5" /> Live Allocation Center
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Problem Statement Allocations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Live tracker of which team chose which problem statement with complete problem descriptions and categories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="input-field text-sm font-bold py-2 w-64 bg-white"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name} ({evt.status})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => fetchAllocations(true)}
            className="btn-secondary text-xs py-2 px-3 gap-1.5"
            title="Refresh Live Claims"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={filteredAllocations.length === 0}
            className="btn-primary text-xs py-2 px-3 gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-indigo-100 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Teams</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{data.total_teams}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across {data.total_slots} active slots</div>
        </div>

        <div className="card p-5 border-emerald-100 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Statements Chosen</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{data.total_chosen}</div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">
            {data.total_teams > 0 ? Math.round((data.total_chosen / data.total_teams) * 100) : 0}% of teams allocated
          </div>
        </div>

        <div className="card p-5 border-amber-100 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Available in Pool</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-600">{data.total_problem_statements}</div>
          <div className="text-[11px] text-slate-400 mt-1">Problem statements configured</div>
        </div>

        <div className="card p-5 border-purple-100 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Pending Teams</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-600">
            {Math.max(0, data.total_teams - data.total_chosen)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Still solving Rounds 1–5</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card p-4 border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by team name, problem title, category, or slot join code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value)}
              className="input-field text-xs font-bold py-2 bg-slate-50"
            >
              <option value="all">All Slots</option>
              {uniqueSlots.map((sn) => (
                <option key={sn} value={String(sn)}>
                  Slot #{sn}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-field text-xs font-bold py-2 bg-slate-50"
          >
            <option value="all">All Statuses</option>
            <option value="chosen">Chosen Only ({data.total_chosen})</option>
            <option value="pending">Pending Only ({Math.max(0, data.total_teams - data.total_chosen)})</option>
          </select>
        </div>
      </div>

      {/* Allocations Cards & Details List */}
      {loading ? (
        <div className="card text-center py-16 text-slate-400 font-bold">
          Loading problem statement allocations...
        </div>
      ) : filteredAllocations.length === 0 ? (
        <div className="card text-center py-16 text-slate-400 border-dashed">
          No teams or problem allocations match the current filters.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>SHOWING {filteredAllocations.length} TEAMS</span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live allocations sync active</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredAllocations.map((item) => {
              const isClaimed = item.has_chosen_problem && item.problem;
              const prob = item.problem;

              return (
                <div
                  key={item.team_id}
                  className={`card p-6 border-2 transition-all shadow-xs ${
                    isClaimed
                      ? 'border-emerald-200 bg-white ring-1 ring-emerald-100'
                      : 'border-slate-200 bg-slate-50/50 opacity-90'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Team Info & Slot Meta */}
                    <div className="space-y-2 lg:w-1/3 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl font-mono border border-slate-200">
                          {item.team_name}
                        </span>
                        {item.slot_number && (
                          <span className="text-xs font-bold font-mono px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Slot #{item.slot_number} ({item.slot_code})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {isClaimed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Claimed Card #{prob.card_number || (prob.card_index + 1)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Solving Round {item.current_round}</span>
                          </span>
                        )}

                        {isClaimed && prob.claimed_at && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(prob.claimed_at).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Full Problem Statement Details */}
                    <div className="flex-1 lg:pl-6 lg:border-l border-slate-100 space-y-2">
                      {isClaimed ? (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1">
                              <Tag className="w-3 h-3" /> {prob.category || 'General'}
                            </span>
                            <span className="text-xs font-bold text-slate-400 font-mono">
                              Card ID: {prob.problem_id?.slice(0, 8)}...
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                            {prob.problem_title}
                          </h3>

                          {prob.description ? (
                            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-sans">
                              {prob.description}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No description provided.</p>
                          )}
                        </>
                      ) : (
                        <div className="py-4 text-xs text-slate-400 italic flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Team is progressing through earlier rounds. Problem statement will be chosen in Round 6.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
