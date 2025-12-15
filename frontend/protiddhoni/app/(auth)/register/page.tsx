'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Register Page
 */
export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { register } = useAuth();

    const handleRegister = async (formData: any) => {
        setIsLoading(true);
        
        try {
            await register(formData.name, formData.username, formData.email, formData.password);
            alert('সফলভাবে নিবন্ধন সম্পন্ন হয়েছে! স্বাগতম প্রতিধ্বনিতে।');
            router.push('/');
        } catch (error: any) {
            alert(error.message || 'নিবন্ধন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthForm 
            type="register" 
            onSubmit={handleRegister} 
            isLoading={isLoading}
        />
    );
}
