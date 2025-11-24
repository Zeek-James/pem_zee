'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginRequest, RegisterRequest, login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Verify token is valid by fetching current user
        const response = await getCurrentUser();
        setUser(response.data);
      }
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await apiLogin(credentials);
      const { access_token, refresh_token, user } = response.data;

      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Set user state
      setUser(user);

      // Redirect to dashboard
      router.push('/');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      await apiRegister(data);
      // After successful registration, redirect to login
      router.push('/login');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    // Call logout API (optional, for logging)
    apiLogout().catch(() => {});

    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Clear user state
    setUser(null);

    // Redirect to login
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
