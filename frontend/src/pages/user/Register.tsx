import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { extractErrorMessage } from '../../lib/errorUtils';
import { Users, Lock, ArrowRight } from 'lucide-react';

export const TeamRegister: React.FC = () => {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginTeam } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get('/events')
      .then((res) => {
        setEvents(res.data);
        if (res.data.length > 0) setEventId(res.data[0].id);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/team/register', {
        team_name: teamName,
        password,
        event_id: eventId,
      });
      loginTeam(res.data.token, res.data.team);
      navigate('/team/join-slot');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Registration failed. Try a different team name.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 shadow-xl border-amber-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-center text-slate-900 mb-1">Team Registration</h2>
        <p className="text-xs text-center text-slate-500 mb-6">Register your team to participate in the live event</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Select Event
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="input-field text-sm font-semibold"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          </div>

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
              Set Team Password
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
            {loading ? 'Registering Team...' : 'Register Team'} <ArrowRight className="w-4 h-4" />
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
