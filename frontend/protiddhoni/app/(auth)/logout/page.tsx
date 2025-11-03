'use client';

import LogoutPage from '@/components/auth/LogoutPage';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Logout Page
 */
export default function Logout() {
    const { logout } = useAuth();
    
    const handleLogout = () => {
        logout();
        console.log('User logged out successfully');
    };

    return <LogoutPage onLogout={handleLogout} />;
}