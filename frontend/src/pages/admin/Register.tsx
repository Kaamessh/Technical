import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { Shield, Lock, Mail, User, ArrowRight } from 'lucide-react';

export const AdminRegister: React.FC = () => {
  const [username, setUsername] = useState('Kaamesh');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/admin/register', {
        username,
        email: 'kaamesh712006@gmail.com',
        password,
      });
      loginAdmin(res.data.token, res.data.admin);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Only kaamesh712006@gmail.com can register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 shadow-xl border-indigo-100">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-center text-slate-900 mb-1">Admin First-Time Registration</h2>
        <p className="text-xs text-center text-slate-500 mb-6">Create the administrator account for the event platform</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Admin Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kaamesh"
                className="input-field pl-9 text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Authorized Admin Email (Strictly Locked)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-indigo-500 absolute left-3 top-3" />
              <input
                type="email"
                readOnly
                value="kaamesh712006@gmail.com"
                className="input-field pl-9 text-sm font-bold bg-slate-100 text-indigo-900 border-indigo-200 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Set Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your secret admin password"
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 font-bold gap-2">
            {loading ? 'Registering Admin...' : 'Register Admin Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <span className="text-xs text-slate-500">Already registered? </span>
          <Link to="/admin/login" className="text-xs font-bold text-indigo-600 hover:underline">
            Admin Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
