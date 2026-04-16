/**
 * Authentication Types
 * Type definitions for auth-related data structures
 */

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  bio?: string;
  profile_picture_url?: string;
  is_admin?: boolean;
  is_verified?: boolean;
  kori_balance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuthFormData {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterData {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
