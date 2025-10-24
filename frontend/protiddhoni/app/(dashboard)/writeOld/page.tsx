'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WritePage() {
    const router = useRouter();
    
    useEffect(() => {
        // Redirect to the new write system
        router.replace('/write/new');
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 bengali-text">লেখার পাতায় নিয়ে যাওয়া হচ্ছে...</p>
            </div>
        </div>
    );
}
