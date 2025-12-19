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
  login: (emailOrUsername: string, password: string) => Promise<void>;
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
        const token = localStorage.getItem('auth_token');
        console.log('Checking auth status, token exists:', !!token);
        
        if (token) {
          try {
            // Fetch user profile from API
            const response = await api.auth.getProfile(token);
            console.log('Auth profile response:', response);
            
            if (response.success && response.data) {
              console.log('User authenticated:', response.data.username);
              setUser(response.data);
            } else {
              // Only clear on explicit auth failure
              console.warn('Auth check failed, clearing token');
              localStorage.removeItem('auth_token');
              setUser(null);
            }
          } catch (apiError: any) {
            console.error('Auth API error:', apiError);
            // Only clear token on 401 Unauthorized
            if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized')) {
              localStorage.removeItem('auth_token');
              setUser(null);
            }
            // For other errors, keep the token and user state
          }
        }
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      // Don't clear token on general errors
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    try {
      // identifier can be either email or username
      const identifier = emailOrUsername; 
      const response = await api.auth.login({ identifier, password });
      
      console.log('Login response:', response);
      
      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;
        
        console.log('User data from login:', userData);
        console.log('Username:', userData.username);
        
        // Store auth data
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', authToken);
        }
        
        setToken(authToken);
        setUser(userData);
      } else {
        throw new Error(response.error || 'লগইন করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'লগইন করতে সমস্যা হয়েছে';
      throw new Error(errorMessage);
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'নিবন্ধন করতে সমস্যা হয়েছে';
      throw new Error(errorMessage);
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