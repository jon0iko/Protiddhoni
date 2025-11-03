'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      const userData = {
        id: Date.now().toString(),
        name: email.split('@')[0],
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`
      };
      
      // Store auth data
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', 'dummy_token_' + Date.now());
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
      
      setUser(userData);
    } catch (error) {
      throw new Error('লগইন করতে সমস্যা হয়েছে');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock user data
      const userData = {
        id: Date.now().toString(),
        name,
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      };
      
      // Store auth data
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', 'dummy_token_' + Date.now());
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
      
      setUser(userData);
    } catch (error) {
      throw new Error('নিবন্ধন করতে সমস্যা হয়েছে');
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isLoggedIn: !!user,
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