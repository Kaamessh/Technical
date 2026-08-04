import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { Users, UserPlus, Edit2, Trash2, ArrowUpDown, Shield } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [slots, setSlots] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [sortMode, setSortMode] = useState<'timestamp' | 'alpha'>('timestamp');
  const [loading, setLoading] = useState(false);

  // Modal create/edit team
  const [showModal, setShowModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [slotId, setSlotId] = useState('');

  useEffect(() => {
    apiClient.get('/events').then((res) => {
      setEvents(res.data);
      if (res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      apiClient.get(`/slots/event/${selectedEventId}`).then((res) => {
        setSlots(res.data);
      });
    }
  }, [selectedEventId]);

  const fetchTeams = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/teams?event_id=${selectedEventId}&sort=${sortMode}`);
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [selectedEventId, sortMode]);

  const handleOpenCreateModal = () => {
    setEditingTeamId(null);
    setTeamName('');
    setPassword('');
    setSlotId('');
    setShowModal(true);
  };

  const handleOpenEditModal = (team: any) => {
    setEditingTeamId(team.id);
    setTeamName(team.team_name);
    setPassword('');
    setSlotId(team.slot_id || '');
    setShowModal(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeamId) {
        await apiClient.patch(`/teams/${editingTeamId}`, {
          team_name: teamName,
          password: password || undefined,
          slot_id: slotId || null,
        });
      } else {
        await apiClient.post('/teams', {
          event_id: selectedEventId,
          team_name: teamName,
          password,
          slot_id: slotId || null,
        });
      }
      setShowModal(false);
      fetchTeams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save team');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await apiClient.delete(`/teams/${id}`);
      fetchTeams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete team');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" /> Team Registry & Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">Audit team registrations, edit passwords, assign slots, or manually add teams.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="input-field text-xs font-semibold py-2 w-48 bg-white"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          )}

          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setSortMode('timestamp')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortMode === 'timestamp' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Sort by Registration Date
            </button>
            <button
              onClick={() => setSortMode('alpha')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortMode === 'alpha' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Sort Alphabetically
            </button>
          </div>

          <button onClick={handleOpenCreateModal} className="btn-primary text-xs py-2 px-4 gap-2">
            <UserPlus className="w-4 h-4" /> Add Team
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-medium border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Team Name</th>
                <th className="py-3.5 px-4">Assigned Slot</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">Loading teams...</td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">No teams registered yet.</td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{team.team_name}</td>
                    <td className="py-3.5 px-4">
                      {team.slots ? (
                        <span className="font-mono text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                          {team.slots.slot_code}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                      {new Date(team.registered_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(team)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Team */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="card max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">
              {editingTeamId ? 'Edit Team Details' : 'Register New Team'}
            </h3>

            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Cyber Ninjas"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password {editingTeamId && '(Leave blank to keep existing)'}
                </label>
                <input
                  type="password"
                  required={!editingTeamId}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assigned Slot (Optional)
                </label>
                <select
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">-- No Slot / Unassigned --</option>
                  {slots.map((s) => (
                    <option key={s.id} value={s.id}>
                      Slot #{s.slot_number} ({s.slot_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs font-bold">
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
