import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { Users, Trash2, Calendar } from 'lucide-react';

export const AdminTeams: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const res = await apiClient.get('/teams');
      setTeams(res.data);
      setErrorMsg(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    // Auto refresh every 10 seconds to show newly registered teams
    const interval = setInterval(fetchTeams, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;
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
            <Users className="w-8 h-8 text-indigo-600" /> Team Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">View and manage all registered teams across events.</p>
        </div>
        <button
          onClick={fetchTeams}
          className="btn-secondary text-sm py-2 px-4 whitespace-nowrap self-start md:self-auto"
        >
          Refresh Teams
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading teams...</div>
      ) : errorMsg ? (
        <div className="card text-center py-12 border-rose-200">
          <h3 className="text-lg font-bold text-rose-800">Error Loading Teams</h3>
          <p className="text-xs text-rose-500">{errorMsg}</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="card text-center py-12 border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Teams Registered</h3>
          <p className="text-xs text-slate-500">Teams will appear here once they register for an event.</p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Team Name
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Registered Date
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Current Slot
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase border border-indigo-200">
                        {team.team_name.substring(0, 2)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-slate-900">{team.team_name}</div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
                          ID: {team.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-600 font-medium">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      {new Date(team.registered_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {team.slots?.slot_code ? (
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {team.slots.slot_code}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic">No Slot Assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-xs"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
