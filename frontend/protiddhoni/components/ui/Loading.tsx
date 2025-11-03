'use client';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}>
        </div>
    );
}

// Page Loading Component
export function PageLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-gray-600 bengali-text">লোড হচ্ছে...</p>
            </div>
        </div>
    );
}

// Content Loading Skeleton
export function ContentSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-300"></div>
            <div className="p-6">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                </div>
            </div>
        </div>
    );
}