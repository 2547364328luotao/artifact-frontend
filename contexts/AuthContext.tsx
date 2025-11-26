import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (u: string, p: string) => Promise<string | undefined>;
  register: (u: string, p: string) => Promise<string | undefined>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (u: string, p: string) => {
    const res = await authService.login(u, p);
    if (res.user) {
      setUser(res.user);
      return undefined;
    }
    return res.error;
  };

  const register = async (u: string, p: string) => {
    const res = await authService.register(u, p);
    if (res.user) {
      setUser(res.user);
      return undefined;
    }
    return res.error;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};