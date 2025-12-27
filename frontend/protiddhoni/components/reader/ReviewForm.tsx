/**
 * Review Form Component
 * Allows users to submit ratings and reviews for content
 */

'use client';

import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface ReviewFormProps {
    contentId: string;
    onReviewSubmitted?: () => void;
    existingReview?: {
        id: string;
        rating: number;
        review_text: string;
    } | null;
}

export default function ReviewForm({ contentId, onReviewSubmitted, existingReview }: ReviewFormProps) {
    const { user, token } = useAuth();
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user || !token) {
            setError('লগইন করুন রিভিউ দিতে');
            return;
        }

        if (rating === 0) {
            setError('অনুগ্রহ করে রেটিং নির্বাচন করুন');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (existingReview) {
                // Update existing review
                const response = await api.reviews.update(
                    existingReview.id,
                    { rating, review_text: reviewText },
                    token
                );
                
                if (response.success) {
                    setSuccess('রিভিউ আপডেট হয়েছে!');
                    onReviewSubmitted?.();
                } else {
                    setError(response.error || 'রিভিউ আপডেট করতে সমস্যা হয়েছে');
                }
            } else {
                // Create new review
                const response = await api.reviews.create(
                    {
                        content_id: contentId,
                        rating,
                        review_text: reviewText
                    },
                    token
                );
                
                if (response.success) {
                    setSuccess('রিভিউ জমা হয়েছে!');
                    setRating(0);
                    setReviewText('');
                    onReviewSubmitted?.();
                } else {
                    setError(response.error || 'রিভিউ জমা দিতে সমস্যা হয়েছে');
                }
            }
        } catch (err: any) {
            setError(err.message || 'কিছু একটা ভুল হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-6 rounded-lg border-2 border-dashed text-center" style={{ borderColor: 'var(--reader-border)', color: 'var(--reader-secondary-text)' }}>
                <p className="bengali-text">রিভিউ দিতে লগইন করুন</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 rounded-lg border" style={{ borderColor: 'var(--reader-border)', backgroundColor: 'var(--reader-card-bg)' }}>
            <h3 className="text-xl font-bold mb-4 bengali-text" style={{ color: 'var(--reader-text)' }}>
                {existingReview ? 'রিভিউ আপডেট করুন' : 'আপনার মতামত দিন'}
            </h3>

            {/* Star Rating */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2 bengali-text" style={{ color: 'var(--reader-text)' }}>
                    রেটিং <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-110 focus:outline-none"
                        >
                            <Star
                                className={`w-8 h-8 ${
                                    (hoverRating || rating) >= star
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                }`}
                            />
                        </button>
                    ))}
                    {rating > 0 && (
                        <span className="ml-2 text-sm self-center bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
                            ({rating}/5)
                        </span>
                    )}
                </div>
            </div>

            {/* Review Text */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2 bengali-text" style={{ color: 'var(--reader-text)' }}>
                    মন্তব্য (ঐচ্ছিক)
                </label>
                <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border bengali-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                        borderColor: 'var(--reader-border)',
                        backgroundColor: 'var(--reader-bg)',
                        color: 'var(--reader-text)'
                    }}
                    placeholder="এই লেখা সম্পর্কে আপনার মতামত লিখুন..."
                    disabled={loading}
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 bengali-text">{error}</p>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600 bengali-text">{success}</p>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading || rating === 0}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium bengali-text hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>জমা হচ্ছে...</span>
                    </>
                ) : (
                    <span>{existingReview ? 'আপডেট করুন' : 'রিভিউ জমা দিন'}</span>
                )}
            </button>
        </form>
    );
}
