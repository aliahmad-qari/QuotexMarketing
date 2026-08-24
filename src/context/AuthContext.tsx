import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types/market';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, role?: UserRole, name?: string) => Promise<void>;
  logout: () => void;
  quickLoginAs: (role: UserRole) => void;
  isAuthModalOpen: boolean;
  openAuthModal: (initialMode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  authModalMode: 'login' | 'signup';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'cpl_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Load session on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (e) {
      console.warn('Failed to parse local auth user', e);
    }
  }, []);

  const login = async (email: string, role: UserRole = 'researcher', name?: string) => {
    // Determine default role based on email if not specified
    let effectiveRole = role;
    if (email.toLowerCase().includes('admin')) {
      effectiveRole = 'admin';
    }

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: email.trim(),
      name: name || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)),
      role: effectiveRole,
      createdAt: Date.now() - 86400000 * 7,
      lastLogin: Date.now(),
    };

    setUser(newUser);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.warn('Failed to save auth state', e);
    }
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove auth state', e);
    }
  };

  const quickLoginAs = (role: UserRole) => {
    if (role === 'admin') {
      login('admin@candlelab.io', 'admin', 'System Admin');
    } else {
      login('researcher@candlelab.io', 'researcher', 'Lead Quant Researcher');
    }
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        quickLoginAs,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
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
