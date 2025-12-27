/**
 * Review Card Component
 * Displays a single review with rating, text, and user info
 */

'use client';

import { useState } from 'react';
import { Star, Trash2, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface ReviewCardProps {
    review: {
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
    };
    onReviewDeleted?: () => void;
    onReviewEdit?: (review: any) => void;
}

export default function ReviewCard({ review, onReviewDeleted, onReviewEdit }: ReviewCardProps) {
    const { user, token } = useAuth();
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isOwner = user?.id === review.user.id;
    const isEdited = new Date(review.updated_at).getTime() !== new Date(review.created_at).getTime();

    const handleDelete = async () => {
        if (!token) return;

        setDeleting(true);
        try {
            const response = await api.reviews.delete(review.id, token);
            if (response.success) {
                onReviewDeleted?.();
            }
        } catch (error) {
            console.error('Error deleting review:', error);
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleEdit = () => {
        onReviewEdit?.(review);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--reader-border)', backgroundColor: 'var(--reader-card-bg)' }}>
            {/* User Info and Rating */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${review.user.username}`}>
                        <img
                            src={review.user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user.full_name || review.user.username)}&background=4F46E5&color=fff&size=40`}
                            alt={review.user.full_name || review.user.username}
                            className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        />
                    </Link>
                    <div>
                        <Link 
                            href={`/profile/${review.user.username}`}
                            className="font-medium hover:text-primary-600 transition-colors bengali-text"
                            style={{ color: 'var(--reader-text)' }}
                        >
                            {review.user.full_name || review.user.username}
                        </Link>
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--reader-secondary-text)' }}>
                            <span className="bengali-text">{formatDate(review.created_at)}</span>
                            {isEdited && (
                                <span className="text-xs bengali-text">(সম্পাদিত)</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {isOwner && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleEdit}
                            className="p-2 rounded transition-colors"
                            style={{ color: 'var(--reader-secondary-text)' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--reader-hover)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="সম্পাদনা"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-2 rounded transition-colors text-red-500 hover:bg-red-50"
                            title="মুছে ফেলুন"
                            disabled={deleting}
                        >
                            {deleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Rating Stars */}
            <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${
                            star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                        }`}
                    />
                ))}
                <span className="ml-1 text-sm font-medium" style={{ color: 'var(--reader-text)' }}>
                    {review.rating}/5
                </span>
            </div>

            {/* Review Text */}
            {review.review_text && (
                <p className="text-sm leading-relaxed bengali-text whitespace-pre-wrap" style={{ color: 'var(--reader-text)' }}>
                    {review.review_text}
                </p>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-3 bengali-text">রিভিউ মুছে ফেলুন?</h3>
                        <p className="text-gray-600 mb-6 bengali-text">
                            আপনি কি নিশ্চিত যে এই রিভিউটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bengali-text"
                                disabled={deleting}
                            >
                                বাতিল
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors bengali-text disabled:opacity-50"
                                disabled={deleting}
                            >
                                {deleting ? 'মুছে ফেলা হচ্ছে...' : 'মুছে ফেলুন'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
