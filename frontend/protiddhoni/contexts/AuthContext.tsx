'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  bio?: string;
  profile_picture_url?: string;
  is_admin?: boolean;
  is_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          // Fetch user profile from API
          const response = await api.auth.getProfile(token);
          setUser(response.data);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login({ email, password });
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        // Store auth data
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }
        
        setUser(userData);
      } else {
        throw new Error(response.error || 'লগইন করতে সমস্যা হয়েছে');
      }
    } catch (error: any) {
      throw new Error(error.message || 'লগইন করতে সমস্যা হয়েছে');
    }
  };

  const register = async (fullName: string, username: string, email: string, password: string) => {
    try {
      const response = await api.auth.register({ 
        full_name: fullName,
        username,
        email, 
        password 
      });
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        // Store auth data
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }
        
        setUser(userData);
      } else {
        throw new Error(response.error || 'নিবন্ধন করতে সমস্যা হয়েছে');
      }
    } catch (error: any) {
      throw new Error(error.message || 'নিবন্ধন করতে সমস্যা হয়েছে');
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await api.auth.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await api.auth.getProfile(token);
        setUser(response.data);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isLoggedIn: !!user,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}