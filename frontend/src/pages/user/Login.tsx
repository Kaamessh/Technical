import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { extractErrorMessage } from '../../lib/errorUtils';
import { Users, Lock, ArrowRight } from 'lucide-react';

export const TeamLogin: React.FC = () => {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginTeam } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/team/login', {
        team_name: teamName,
        password,
      });
      loginTeam(res.data.token, res.data.team);
      if (res.data.team.slot_id) {
        navigate('/team/play');
      } else {
        navigate('/team/join-slot');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Invalid team name or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 shadow-xl border-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-center text-slate-900 mb-1">Team Portal</h2>
        <p className="text-xs text-center text-slate-500 mb-6">Sign in to your registered team account</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Team Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Altruixx"
              className="input-field text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field text-sm"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 font-bold gap-2">
            {loading ? 'Authenticating...' : 'Sign In as Team'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <span className="text-xs text-slate-500">Need to create a team? </span>
          <Link to="/team/register" className="text-xs font-bold text-amber-600 hover:underline">
            Register New Team
          </Link>
        </div>
      </div>
    </div>
  );
};
