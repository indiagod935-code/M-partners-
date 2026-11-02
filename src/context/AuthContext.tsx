import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchDemo: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mpartner_token') || 'usr_customer_1');
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-user-id': authToken,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // If token invalid, default to demo customer
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      setToken(data.token);
      localStorage.setItem('mpartner_token', data.token);
      await fetchCurrentUser(data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const switchDemo = async (targetRole: UserRole) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem('mpartner_token', data.token);
        await fetchCurrentUser(data.token);
      }
    } catch (err) {
      console.error('Demo switch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mpartner_token');
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchDemo, refreshUser, setUser }}>
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
