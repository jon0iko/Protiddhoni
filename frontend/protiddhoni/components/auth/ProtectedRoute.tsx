'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

/**
 * Protected Route Component
 * Handles authentication and authorization checks
 */
export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, isLoading, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Check if user needs to be authenticated
      if (requireAuth && !isLoggedIn) {
        router.push(redirectTo);
        return;
      }

      // Check if user needs to be admin
      if (requireAdmin && (!user || !user.is_admin)) {
        router.push('/');
        return;
      }
    }
  }, [isLoading, isLoggedIn, user, requireAuth, requireAdmin, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 bengali-text">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // Don't render if auth requirements not met
  if (requireAuth && !isLoggedIn) {
    return null;
  }

  if (requireAdmin && (!user || !user.is_admin)) {
    return null;
  }

  return <>{children}</>;
}
