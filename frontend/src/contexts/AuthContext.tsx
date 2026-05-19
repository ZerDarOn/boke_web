import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { getAuthToken, setAuthToken } from '../lib/api/request';

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // 优先从 localStorage 恢复用户数据，避免闪烁
  const getStoredUser = (): User | null => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  };

  const [user, setUser] = useState<User | null>(getStoredUser);
  // 如果有token但还没验证完，显示验证中而不是完全未登录
  const hasToken = !!getAuthToken();
  const [loading, setLoading] = useState(hasToken); // 有token时才需要loading
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // 有token才需要验证
    if (hasToken) {
      checkAuth();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      setIsChecking(true);
      
      const result = await api.auth.me();

      if (result.success && result.data) {
        localStorage.setItem('auth_user', JSON.stringify(result.data));
        setUser(result.data);
      } else {
        setAuthToken(null);
        localStorage.removeItem('auth_user');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ checkAuth failed:', error);
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsChecking(false);
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const result = await api.auth.login(username, password);

      if (result.success && result.data && result.data.token) {
        setAuthToken(result.data.token);
        localStorage.setItem('auth_user', JSON.stringify(result.data.user));
        setUser(result.data.user);
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.auth.logout();
      setAuthToken(null);
      localStorage.removeItem('auth_user');
      setUser(null);
    } catch (error) {
      console.error('❌ Logout failed:', error);
      setAuthToken(null);
      localStorage.removeItem('auth_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
