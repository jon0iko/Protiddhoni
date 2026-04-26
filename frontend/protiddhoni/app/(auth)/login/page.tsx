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
            let errorMessage = 'লগইন করতে সমস্যা হয়েছে।';
            
            if (error instanceof Error) {
                const msg = error.message.toLowerCase();
                if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('wrong')) {
                    errorMessage = 'ইমেইল/ব্যবহারকারী নাম বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।';
                } else if (msg.includes('not found') || msg.includes('does not exist')) {
                    errorMessage = 'এই ইমেইল/ব্যবহারকারী নাম দিয়ে কোনো একাউন্ট পাওয়া যায়নি। নিবন্ধন করুন।';
                } else if (msg.includes('network') || msg.includes('connection')) {
                    errorMessage = 'ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।';
                } else if (msg.includes('blocked') || msg.includes('suspended')) {
                    errorMessage = 'আপনার একাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে। সহায়তার জন্য যোগাযোগ করুন।';
                } else {
                    errorMessage = error.message;
                }
            }
            
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
