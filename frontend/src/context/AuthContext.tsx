import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

interface UserProfile {
  id: string;
  name: string;
  team_name?: string;
  email?: string;
  role: 'admin' | 'team';
  event_id?: string;
  slot_id?: string | null;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  loginAdmin: (token: string, admin: any) => void;
  loginTeam: (token: string, team: any) => void;
  logout: () => void;
  updateTeamSlot: (slotId: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error parsing auth_user:', e);
      localStorage.removeItem('auth_user');
    }
    return null;
  });

  // Auto-sync latest slot_id from team-status
  useEffect(() => {
    if (token && user?.role === 'team') {
      apiClient
        .get('/gameplay/team-status')
        .then((res) => {
          if (res.data?.slot_id && res.data.slot_id !== user.slot_id) {
            const updated: UserProfile = { ...user, slot_id: res.data.slot_id };
            setUser(updated);
            localStorage.setItem('auth_user', JSON.stringify(updated));
          }
        })
        .catch(() => {});
    }
  }, [token, user?.role, user?.slot_id]);

  const loginAdmin = (newToken: string, admin: any) => {
    const profile: UserProfile = {
      id: admin.id,
      name: admin.username,
      email: admin.email,
      role: 'admin',
    };
    setToken(newToken);
    setUser(profile);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(profile));
  };

  const loginTeam = (newToken: string, team: any) => {
    const profile: UserProfile = {
      id: team.id,
      name: team.team_name,
      role: 'team',
      event_id: team.event_id,
      slot_id: team.slot_id,
    };
    setToken(newToken);
    setUser(profile);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(profile));
  };

  const updateTeamSlot = (slotId: string) => {
    if (user && user.role === 'team') {
      const updated = { ...user, slot_id: slotId };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loginAdmin,
        loginTeam,
        logout,
        updateTeamSlot,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
