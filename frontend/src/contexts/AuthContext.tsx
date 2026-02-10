'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User, UserRole, JwtPayload, AuthTokens } from '@/types';
import { getTokens, setTokens, clearTokens } from '@/lib/tokenStorage';
import apiClient from '@/lib/apiClient';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Decode JWT and extract role
  const decodeToken = useCallback((accessToken: string): JwtPayload | null => {
    try {
      return jwtDecode<JwtPayload>(accessToken);
    } catch {
      return null;
    }
  }, []);

  // Fetch current user profile
  const fetchProfile = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      clearTokens();
      setUser(null);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const tokens = getTokens();
      if (tokens?.accessToken) {
        const decoded = decodeToken(tokens.accessToken);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          await fetchProfile();
        } else {
          // Token expired, try refresh
          try {
            const response = await apiClient.post('/auth/refresh', {
              refreshToken: tokens.refreshToken,
            });
            const newTokens: AuthTokens = response.data.data;
            setTokens(newTokens);
            await fetchProfile();
          } catch {
            clearTokens();
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [decodeToken, fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    
    if (response.data.success) {
      const { accessToken, refreshToken, user: userData } = response.data.data;
      setTokens({ accessToken, refreshToken });
      setUser(userData);
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  }, []);

  const logout = useCallback(() => {
    const tokens = getTokens();
    if (tokens?.refreshToken) {
      // Fire-and-forget logout call
      apiClient.post('/auth/logout', { refreshToken: tokens.refreshToken }).catch(() => {});
    }
    clearTokens();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
