'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { AuthFormData } from '@/types/auth';

/**
 * Register Page
 */
export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const { register } = useAuth();

    const handleRegister = async (formData: AuthFormData) => {
        setIsLoading(true);
        setError('');
        
        try {
            await register(formData.name, formData.username, formData.email, formData.password);
            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 1500);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'নিবন্ধন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
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
            {success && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    সফলভাবে নিবন্ধন সম্পন্ন হয়েছে! স্বাগতম প্রতিধ্বনিতে।
                </div>
            )}
            <AuthForm 
                type="register" 
                onSubmit={handleRegister} 
                isLoading={isLoading}
            />
        </>
    );
}
