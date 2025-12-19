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
  token: string | null;
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('auth_token');
        
        if (storedToken) {
          setToken(storedToken);
          // Fetch user profile from API
          const response = await api.auth.getProfile(storedToken);
          setUser(response.data);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login({ email, password });
      
      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;
        
        // Store auth data
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', authToken);
        }
        
        setToken(authToken);
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
        const { token: authToken, user: userData } = response.data;
        
        // Store auth data
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', authToken);
        }
        
        setToken(authToken);
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
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        await api.auth.logout(storedToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        const response = await api.auth.getProfile(storedToken);
        setUser(response.data);
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
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