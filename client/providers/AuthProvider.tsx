'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  changePasswordRequest,
  fetchCsrfToken,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
} from '../services/authClient';
import { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  csrfToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const csrf = await fetchCsrfToken();
      setCsrfToken(csrf);
      const refreshed = await refreshRequest(csrf);
      setAccessToken(refreshed.data!.accessToken);
      setCsrfToken(refreshed.data!.csrfToken);
      const me = await meRequest(refreshed.data!.accessToken);
      setUser(me.data!.user);
      return true;
    } catch {
      setAccessToken(null);
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setIsLoading(true);
      await refresh();
      if (active) setIsLoading(false);
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    setAccessToken(response.data!.accessToken);
    setCsrfToken(response.data!.csrfToken);
    const me = await meRequest(response.data!.accessToken);
    setUser(me.data!.user);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const response = await registerRequest(email, password, displayName);
    setAccessToken(response.data!.accessToken);
    setCsrfToken(response.data!.csrfToken);
    const me = await meRequest(response.data!.accessToken);
    setUser(me.data!.user);
  }, []);

  const logout = useCallback(async () => {
    if (csrfToken) {
      await logoutRequest(csrfToken).catch(() => undefined);
    }
    setAccessToken(null);
    setUser(null);
    setCsrfToken(null);
  }, [csrfToken]);

  const changePassword = useCallback(
    async (currentPassword: string, nextPassword: string) => {
      if (!accessToken || !csrfToken) throw new Error('Authentication required.');
      await changePasswordRequest(accessToken, csrfToken, currentPassword, nextPassword);
      setAccessToken(null);
      setUser(null);
      setCsrfToken(null);
    },
    [accessToken, csrfToken]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      csrfToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      register,
      logout,
      refresh,
      changePassword,
    }),
    [accessToken, changePassword, csrfToken, isLoading, login, logout, refresh, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
