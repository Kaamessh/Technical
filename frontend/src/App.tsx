import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';

import { AdminLogin } from './pages/admin/Login';
import { AdminRegister } from './pages/admin/Register';
import { AdminDashboard } from './pages/admin/Dashboard';
import { SlotManager } from './pages/admin/SlotManager';
import { QuestionBank } from './pages/admin/QuestionBank';
import { AdminLeaderboard } from './pages/admin/Leaderboard';
import { AdminSettings } from './pages/admin/Settings';
import { AdminTeams } from './pages/admin/Teams';

import { TeamRegister } from './pages/user/Register';
import { TeamLogin } from './pages/user/Login';
import { SlotJoin } from './pages/user/SlotJoin';
import { Round1Quiz } from './pages/user/Round1Quiz';
import { Round2Workflow } from './pages/user/Round2Workflow';
import { Round3AiOrReal } from './pages/user/Round3AiOrReal';
import { Round4DataChallenge } from './pages/user/Round4DataChallenge';
import { Round5Password } from './pages/user/Round5Password';
import { EventCompleted } from './pages/user/Completed';
import { TeamLeaderboardPage } from './pages/user/TeamLeaderboardPage';

// Protected Route Guard
const RequireAuth: React.FC<{ children: JSX.Element; role?: 'admin' | 'team' }> = ({ children, role }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/team/login'} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/team/play'} replace />;
  }

  return children;
};

// Home Landing Redirect
const HomeRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/team/login" replace />;
  }
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/team/play'} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAuth role="admin">
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/slots"
            element={
              <RequireAuth role="admin">
                <SlotManager />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/question-bank"
            element={
              <RequireAuth role="admin">
                <QuestionBank />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/leaderboard"
            element={
              <RequireAuth role="admin">
                <AdminLeaderboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireAuth role="admin">
                <AdminSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <RequireAuth role="admin">
                <AdminTeams />
              </RequireAuth>
            }
          />

          {/* Team Routes */}
          <Route path="/team/register" element={<TeamRegister />} />
          <Route path="/team/login" element={<TeamLogin />} />
          <Route
            path="/team/join-slot"
            element={
              <RequireAuth role="team">
                <SlotJoin />
              </RequireAuth>
            }
          />
          <Route
            path="/team/play"
            element={
              <RequireAuth role="team">
                <Round1Quiz />
              </RequireAuth>
            }
          />
          <Route
            path="/team/round-1"
            element={
              <RequireAuth role="team">
                <Round1Quiz />
              </RequireAuth>
            }
          />
          <Route
            path="/team/round-2"
            element={
              <RequireAuth role="team">
                <Round2Workflow />
              </RequireAuth>
            }
          />
          <Route
            path="/team/round-3"
            element={
              <RequireAuth role="team">
                <Round3AiOrReal />
              </RequireAuth>
            }
          />
          <Route
            path="/team/round-4"
            element={
              <RequireAuth role="team">
                <Round4DataChallenge />
              </RequireAuth>
            }
          />
          <Route
            path="/team/round-5"
            element={
              <RequireAuth role="team">
                <Round5Password />
              </RequireAuth>
            }
          />
          <Route
            path="/team/completed"
            element={
              <RequireAuth role="team">
                <EventCompleted />
              </RequireAuth>
            }
          />
          <Route
            path="/team/leaderboard"
            element={
              <RequireAuth role="team">
                <TeamLeaderboardPage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
