import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { Users, Lock, Sparkles, ArrowRight } from 'lucide-react';

export const TeamRegister: React.FC = () => {
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
      const res = await apiClient.post('/auth/team/register', {
        team_name: teamName,
        password,
      });
      loginTeam(res.data.token, res.data.team);
      navigate('/team/join-slot');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Try a different team name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 shadow-xl border-indigo-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-center text-slate-900 mb-1">Register Team</h2>
        <p className="text-xs text-center text-slate-500 mb-6">Create your competitive team profile for the live event</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
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
            <span className="text-[11px] text-slate-400 mt-1 block">
              Case-insensitive unique check (e.g. Altruixx == altruixx)
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Team Secret Password
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

          <button type="submit" disabled={loading} className="btn-accent w-full py-3 mt-2 font-bold gap-2">
            {loading ? 'Creating Team...' : 'Register Team & Continue'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <span className="text-xs text-slate-500">Already registered? </span>
          <Link to="/team/login" className="text-xs font-bold text-indigo-600 hover:underline">
            Team Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
