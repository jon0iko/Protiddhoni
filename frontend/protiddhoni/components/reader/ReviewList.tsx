/**
 * Review List Component
 * Displays all reviews for a content with stats
 */

'use client';

import { useEffect, useState } from 'react';
import { Star, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

interface ReviewListProps {
    contentId: string;
}

interface Review {
    id: string;
    rating: number;
    review_text: string;
    created_at: string;
    updated_at: string;
    user: {
        id: string;
        username: string;
        full_name: string;
        profile_picture_url: string | null;
    };
}

interface ReviewStats {
    average: number;
    count: number;
}

export default function ReviewList({ contentId }: ReviewListProps) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats>({ average: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [userReview, setUserReview] = useState<Review | null>(null);

    useEffect(() => {
        loadReviews();
    }, [contentId]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const response = await api.reviews.getByContentId(contentId);
            if (response.success) {
                setReviews(response.data || []);
                setStats(response.stats || { average: 0, count: 0 });

                // Find user's review if they're logged in
                if (user && response.data) {
                    const myReview = response.data.find((r: Review) => r.user.id === user.id);
                    setUserReview(myReview || null);
                }
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmitted = () => {
        loadReviews();
        setShowReviewForm(false);
        setEditingReview(null);
    };

    const handleReviewDeleted = () => {
        loadReviews();
    };

    const handleReviewEdit = (review: Review) => {
        setEditingReview(review);
        setShowReviewForm(true);
        // Scroll to form
        setTimeout(() => {
            const formElement = document.getElementById('review-form');
            formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleCancelEdit = () => {
        setEditingReview(null);
        setShowReviewForm(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--reader-secondary-text)' }} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Review Stats */}
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold bengali-text" style={{ color: 'var(--reader-text)' }}>
                    পাঠকদের মতামত
                </h3>
                {stats.count > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xl font-bold" style={{ color: 'var(--reader-text)' }}>
                                {stats.average.toFixed(1)}
                            </span>
                        </div>
                        <span className="text-sm bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
                            ({stats.count} রিভিউ)
                        </span>
                    </div>
                )}
            </div>

            {/* Rating Distribution (optional enhancement) */}
            {stats.count > 0 && (
                <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--reader-border)', backgroundColor: 'var(--reader-card-bg)' }}>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-4xl font-bold" style={{ color: 'var(--reader-text)' }}>
                                {stats.average.toFixed(1)}
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                            star <= Math.round(stats.average)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                            <div className="text-sm mt-1 bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
                                {stats.count} রিভিউ
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Form Toggle */}
            {user && (
                <div id="review-form">
                    {!userReview && !showReviewForm && !editingReview && (
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium bengali-text hover:bg-blue-700 transition-colors"
                        >
                            রিভিউ লিখুন
                        </button>
                    )}

                    {(showReviewForm || editingReview) && (
                        <div>
                            <ReviewForm
                                contentId={contentId}
                                onReviewSubmitted={handleReviewSubmitted}
                                existingReview={editingReview}
                            />
                            {editingReview && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="mt-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bengali-text"
                                >
                                    বাতিল করুন
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--reader-border)' }} />
                        <p className="text-lg bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
                            এখনও কোন রিভিউ নেই
                        </p>
                        <p className="text-sm mt-2 bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
                            প্রথম রিভিউ দিন!
                        </p>
                    </div>
                ) : (
                    <>
                        <h4 className="font-semibold text-lg bengali-text" style={{ color: 'var(--reader-text)' }}>
                            সকল রিভিউ ({reviews.length})
                        </h4>
                        {reviews.map((review) => (
                            <ReviewCard
                                key={review.id}
                                review={review}
                                onReviewDeleted={handleReviewDeleted}
                                onReviewEdit={handleReviewEdit}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
