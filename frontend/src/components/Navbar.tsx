import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BackButton } from './BackButton';
import { Trophy, Shield, Users, LogOut, Award, Layers, HelpCircle, ShieldAlert } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 font-black text-lg">
              ⚡
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">AI <span className="text-indigo-600">SPRINT</span></span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Live Event
              </span>
            </div>
          </Link>
        </div>

        {user ? (
          <nav className="flex items-center gap-4">
            {user.role === 'admin' ? (
              <>
                <Link to="/admin/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                  <Layers className="w-4 h-4" /> Events
                </Link>
                <Link to="/admin/leaderboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                  <Trophy className="w-4 h-4" /> Leaderboard
                </Link>
                <Link to="/admin/malpractice" className="text-sm font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> Malpractice
                </Link>
                <Link to="/admin/teams" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                  <Users className="w-4 h-4" /> Teams
                </Link>
              </>
            ) : (
              <>
                <Link to="/team/play" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors">
                  <span>⚡ Challenge Arena</span>
                </Link>
                <Link to="/team/leaderboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                  <Trophy className="w-4 h-4" /> Rank
                </Link>
              </>
            )}

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-slate-900">{user.name}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
                  {user.role}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/team/login" className="btn-secondary text-xs py-2 px-4">
              Team Login
            </Link>
            <Link to="/admin/login" className="btn-primary text-xs py-2 px-4">
              Admin Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
