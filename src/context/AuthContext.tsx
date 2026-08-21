import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, getStoredUser, setStoredAuth, clearStoredAuth } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateAuthUser: (updatedUser: User, newToken?: string) => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const storedToken = getStoredToken();
    if (storedToken) {
      try {
        const res = await api.getMe();
        setUser(res.user);
        const curTok = getStoredToken() || token || '';
        setStoredAuth(curTok, res.user);
      } catch {
        // do not auto-logout on transient network errors
      }
    }
  };

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          clearStoredAuth();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }

    verifyAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setStoredAuth(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  };

  const updateAuthUser = (updatedUser: User, newToken?: string) => {
    const activeToken = newToken || token || getStoredToken() || '';
    setStoredAuth(activeToken, updatedUser);
    setUser(updatedUser);
    if (newToken) {
      setToken(newToken);
    }
  };

  const isAdmin = user?.perfil === 'admin';
  const isUser = !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateAuthUser, refreshUser, isAdmin, isUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
