'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Login Page
 */
export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async (formData: any) => {
        setIsLoading(true);
        
        try {
            await login(formData.email, formData.password);
            router.push('/');
        } catch (error: any) {
            alert(error.message || 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthForm 
            type="login" 
            onSubmit={handleLogin} 
            isLoading={isLoading}
        />
    );
}
