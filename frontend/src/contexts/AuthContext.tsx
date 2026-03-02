import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // 延迟执行，避免竞态条件
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const checkAuth = async () => {
    try {
      setIsChecking(true);
      console.log('🔐 checkAuth() called');
      
      const result = await api.auth.me();
      console.log('🔐 checkAuth result:', result);

      if (result.success && result.data) {
        setUser(result.data);
        console.log('✅ User set from checkAuth:', result.data);
      } else {
        localStorage.removeItem('auth_token');
        setUser(null);
        console.log('❌ No valid user data, cleared token');
      }
    } catch (error) {
      console.error('❌ checkAuth failed:', error);
      setUser(null);
    } finally {
      setIsChecking(false);
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    console.log('🔐 AuthContext.login() called');
    console.log('📝 Username:', username);
    console.log('🔑 Password:', password);

    try {
      setLoading(true);
      const result = await api.auth.login(username, password);
      
      console.log('📡 API result:', result);

      if (result.success && result.data && result.data.token) {
        localStorage.setItem('auth_token', result.data.token);
        setUser(result.data.user);
        console.log('✅ Token saved to localStorage');
        console.log('✅ User set:', result.data.user);
      } else {
        console.log('❌ Login failed - no token in response');
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
      console.log('🔐 logout() called');
      await api.auth.logout();
      localStorage.removeItem('auth_token');
      setUser(null);
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
