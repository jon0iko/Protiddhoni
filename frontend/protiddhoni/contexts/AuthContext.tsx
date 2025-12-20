'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  // Secure token getter that always reads from both state and storage
  const getToken = useCallback((): string | null => {
    if (token) return token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }, [token]);

  // Initialize auth state from localStorage
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const init = async () => {
      try {
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        // Set token immediately from storage
        setToken(storedToken);

        // Try to restore user from cache first for instant UI update
        if (storedUser) {
          try {
            const cachedUser = JSON.parse(storedUser);
            setUser(cachedUser);
          } catch (e) {
            console.warn('Failed to parse cached user:', e);
          }
        }

        // Then verify with backend
        try {
          const response = await api.auth.getProfile(storedToken);
          
          if (response.success && response.data) {
            setUser(response.data);
            // Update cached user
            localStorage.setItem(USER_KEY, JSON.stringify(response.data));
          } else {
            // Invalid token, clear auth state
            clearAuthState();
          }
        } catch (error: unknown) {
          // Only clear on authentication errors
          if (isAuthError(error)) {
            clearAuthState();
          } else {
            // Network/server errors - keep cached state
            console.warn('Auth verification failed, using cached state:', error);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAuthState = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  const isAuthError = (error: unknown): boolean => {
    const message = (error as Error)?.message?.toLowerCase() || '';
    return (
      message.includes('401') ||
      message.includes('unauthorized') ||
      message.includes('invalid token') ||
      message.includes('token expired')
    );
  };

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const identifier = emailOrUsername;
      const response = await api.auth.login({ identifier, password });
      
      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;
        
        // Store auth data atomically
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, authToken);
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
        }
        
        // Update state
        setToken(authToken);
        setUser(userData);
      } else {
        throw new Error(response.error || 'লগইন করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Login error:', error);
      clearAuthState();
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
        
        // Store auth data atomically
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, authToken);
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
        }
        
        // Update state
        setToken(authToken);
        setUser(userData);
      } else {
        throw new Error(response.error || 'নিবন্ধন করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Register error:', error);
      clearAuthState();
      const errorMessage = error instanceof Error ? error.message : 'নিবন্ধন করতে সমস্যা হয়েছে';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      const currentToken = getToken();
      if (currentToken) {
        // Fire and forget - don't wait for server response
        api.auth.logout(currentToken).catch(err => 
          console.warn('Logout request failed:', err)
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
    }
  };

  const refreshUser = async () => {
    try {
      const currentToken = getToken();
      if (!currentToken) {
        clearAuthState();
        return;
      }

      const response = await api.auth.getProfile(currentToken);
      
      if (response.success && response.data) {
        setUser(response.data);
        setToken(currentToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(response.data));
        }
      } else {
        clearAuthState();
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      if (isAuthError(error)) {
        clearAuthState();
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isLoggedIn: !!user && !!token,
    refreshUser,
    getToken,
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