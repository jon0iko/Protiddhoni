/**
 * Rating Widget Component
 * Allows users to rate content (no login required)
 * Separate from comments system
 */

'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface RatingWidgetProps {
    contentId: string;
}

export default function RatingWidget({ contentId }: RatingWidgetProps) {
    const { token } = useAuth();
    const [averageRating, setAverageRating] = useState<number>(0);
    const [ratingCount, setRatingCount] = useState<number>(0);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadRatingStats();
    }, [contentId]);

    const loadRatingStats = async () => {
        setLoading(true);
        try {
            const response = await api.ratings.getStats(contentId, token || undefined);
            
            if (response.success && response.data) {
                setAverageRating(response.data.average_rating || 0);
                setRatingCount(response.data.rating_count || 0);
                setUserRating(response.data.user_rating || null);
            }
        } catch (err: any) {
            console.error('Error loading rating stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRatingClick = async (rating: number) => {
        if (submitting) return;

        // Allow clicking same star to remove rating
        const newRating = userRating === rating ? null : rating;
        
        if (newRating === null) {
            setError('রেটিং সরানোর জন্য আবার চেষ্টা করুন');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await api.ratings.submit(
                { content_id: contentId, rating: newRating },
                token || undefined
            );

            if (response.success && response.data) {
                setUserRating(newRating);
                setAverageRating(response.data.average_rating || 0);
                setRatingCount(response.data.rating_count || 0);
                setSuccessMessage('রেটিং সফলভাবে জমা হয়েছে!');
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(response.error || 'রেটিং জমা দিতে সমস্যা হয়েছে');
            }
        } catch (err: any) {
            setError(err.message || 'কিছু একটা ভুল হয়েছে');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-xl p-6 flex items-center justify-center" style={{ backgroundColor: 'var(--reader-card-bg)' }}>
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--reader-secondary-text)' }} />
            </div>
        );
    }

    return (
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: 'var(--reader-card-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold bengali-text flex items-center gap-2" style={{ color: 'var(--reader-text)' }}>
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    রেট করুন
                </h3>
                {!token && (
                    <span className="text-xs bengali-text px-2 py-1 rounded" style={{ 
                        backgroundColor: 'var(--reader-bg)', 
                        color: 'var(--reader-secondary-text)' 
                    }}>
                        লগইন ছাড়াই রেট করুন
                    </span>
                )}
            </div>

            {/* Rating Display */}
            <div className="flex items-center gap-4">
                {/* Stars */}
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                        const filled = (hoverRating || userRating || 0) >= star;
                        return (
                            <button
                                key={star}
                                onClick={() => handleRatingClick(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                disabled={submitting}
                                className="transition-all hover:scale-110 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`${star} তারকা রেটিং দিন`}
                            >
                                <Star
                                    className={`w-8 h-8 transition-colors ${
                                        filled
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300 hover:text-yellow-200'
                                    }`}
                                />
                            </button>
                        );
                    })}
                </div>

                {/* Average Rating Info */}
                <div className="flex flex-col">
                    {ratingCount > 0 ? (
                        <>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold" style={{ color: 'var(--reader-text)' }}>
                                    {averageRating.toFixed(1)}
                                </span>
                                <span className="text-sm bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
                                    / 5
                                </span>
                            </div>
                            <span className="text-xs bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
                                {ratingCount} জন রেট করেছে
                            </span>
                        </>
                    ) : (
                        <span className="text-sm bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
                            এখনো কেউ রেট করেনি
                        </span>
                    )}
                </div>
            </div>

            {/* User's Current Rating */}
            {userRating && (
                <div className="flex items-center gap-2 text-sm bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
                    <span>আপনার রেটিং:</span>
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-4 h-4 ${
                                    star <= userRating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="font-semibold">({userRating}/5)</span>
                </div>
            )}

            {/* Success Message */}
            {successMessage && (
                <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm text-green-700 bengali-text">{successMessage}</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700 bengali-text">{error}</p>
                </div>
            )}

            {/* Helper Text */}
            {!userRating && !submitting && (
                <p className="text-xs bengali-text text-center" style={{ color: 'var(--reader-secondary-text)' }}>
                    তারকায় ক্লিক করে এই কন্টেন্টটি রেট করুন
                </p>
            )}
        </div>
    );
}
