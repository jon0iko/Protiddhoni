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
            let errorMessage = 'নিবন্ধন করতে সমস্যা হয়েছে।';
            
            if (error instanceof Error) {
                const msg = error.message.toLowerCase();
                if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('taken')) {
                    if (msg.includes('email')) {
                        errorMessage = 'এই ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে। অন্য ইমেইল ব্যবহার করুন বা লগইন করুন।';
                    } else if (msg.includes('username')) {
                        errorMessage = 'এই ব্যবহারকারী নাম ইতিমধ্যে নেওয়া হয়েছে। অন্য নাম চেষ্টা করুন।';
                    } else {
                        errorMessage = 'এই ইমেইল বা ব্যবহারকারী নাম ইতিমধ্যে ব্যবহৃত হয়েছে।';
                    }
                } else if (msg.includes('invalid email')) {
                    errorMessage = 'বৈধ ইমেইল ঠিকানা প্রদান করুন।';
                } else if (msg.includes('password') && (msg.includes('short') || msg.includes('weak'))) {
                    errorMessage = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
                } else if (msg.includes('network') || msg.includes('connection')) {
                    errorMessage = 'ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।';
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
