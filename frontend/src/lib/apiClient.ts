import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('auth_token');
    
    // If token is wrapped in quotes from a previous bad save, clean it
    if (token && token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }

    if (token) {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      const isLoginOrRegister = currentPath.includes('/login') || currentPath.includes('/register');

      if (!isLoginOrRegister) {
        let isTeam = false;
        try {
          const savedUser = localStorage.getItem('auth_user');
          if (savedUser) {
            const u = JSON.parse(savedUser);
            if (u && u.role === 'team') isTeam = true;
          }
        } catch (e) {}

        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');

        window.location.href = isTeam ? '/team/login' : '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);
