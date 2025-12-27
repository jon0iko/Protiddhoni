/**
 * Comment List Component
 * Displays all comments for a content with nested replies
 */

'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import CommentForm from './CommentForm';
import CommentCard from './CommentCard';

interface Comment {
    id: string;
    comment_text: string;
    created_at: string;
    updated_at: string;
    is_edited: boolean;
    user: {
        id: string;
        username: string;
        full_name: string;
        profile_picture_url: string | null;
    };
    replies?: Comment[];
}

interface CommentListProps {
    contentId: string;
}

export default function CommentList({ contentId }: CommentListProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [totalComments, setTotalComments] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchComments = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await api.comments.getByContentId(contentId);
            
            if (response.success && response.data) {
                setComments(response.data.comments || []);
                setTotalComments(response.data.totalComments || 0);
            } else {
                setError(response.error || 'মন্তব্য লোড করতে সমস্যা হয়েছে');
            }
        } catch (err: any) {
            setError(err.message || 'কিছু একটা ভুল হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [contentId]);

    const handleCommentUpdate = () => {
        fetchComments();
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--reader-card-bg)' }}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold bengali-text flex items-center gap-2" style={{ color: 'var(--reader-text)' }}>
                            <MessageCircle className="w-6 h-6" />
                            মন্তব্য
                        </h2>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bengali-text" style={{ backgroundColor: 'var(--reader-bg)', color: 'var(--reader-secondary-text)' }}>
                            {totalComments} টি
                        </span>
                    </div>
                </div>

                {/* Comment Form */}
                <CommentForm
                    contentId={contentId}
                    onCommentSubmitted={handleCommentUpdate}
                />
            </div>

            {/* Comments Section */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--reader-secondary-text)' }} />
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <p className="text-red-600 bengali-text">{error}</p>
                    <button
                        onClick={fetchComments}
                        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg bengali-text hover:bg-primary-700 transition-colors"
                    >
                        আবার চেষ্টা করুন
                    </button>
                </div>
            ) : comments.length === 0 ? (
                <div 
                    className="text-center py-12 rounded-xl"
                    style={{ backgroundColor: 'var(--reader-card-bg)' }}
                >
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: 'var(--reader-secondary-text)' }} />
                    <p className="text-lg bengali-text mb-2" style={{ color: 'var(--reader-text)' }}>
                        এখনো কোনো মন্তব্য নেই
                    </p>
                    <p className="text-sm bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
                        প্রথম মন্তব্য করুন এবং আলোচনা শুরু করুন
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            contentId={contentId}
                            onCommentUpdate={handleCommentUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
