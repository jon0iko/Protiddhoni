'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { AuthFormData } from '@/types/auth';

/**
 * Login Page
 */
export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const handleLogin = async (formData: AuthFormData) => {
        setIsLoading(true);
        setError('');
        
        try {
            // Can use email or username
            const identifier = formData.email || formData.username;
            await login(identifier, formData.password);
            router.push('/');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {error && (
                <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    {error}
                </div>
            )}
            <AuthForm 
                type="login" 
                onSubmit={handleLogin} 
                isLoading={isLoading}
            />
        </>
    );
}
