/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, jsx-a11y/role-has-required-aria-props, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
/**
 * Comment Form Component
 * Allows users to post comments (login required)
 * Ratings are now separate - see RatingWidget component
 */

'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface CommentFormProps {
    contentId: string;
    parentCommentId?: string | null;
    onCommentSubmitted?: () => void;
    onCancel?: () => void;
    existingComment?: {
        id: string;
        comment_text: string;
    } | null;
    placeholder?: string;
}

export default function CommentForm({ 
    contentId, 
    parentCommentId = null,
    onCommentSubmitted, 
    onCancel,
    existingComment,
    placeholder = 'আপনার মতামত লিখুন...'
}: CommentFormProps) {
    const { user, token } = useAuth();
    const [commentText, setCommentText] = useState(existingComment?.comment_text || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user || !token) {
            setError('লগইন করুন মন্তব্য করতে');
            return;
        }

        if (!commentText.trim()) {
            setError('অনুগ্রহ করে মন্তব্য লিখুন');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (existingComment) {
                // Update existing comment
                const response = await api.comments.update(
                    existingComment.id, { comment_text: commentText }
                );
                
                if (response.success) {
                    onCommentSubmitted?.();
                } else {
                    setError(response.error || 'মন্তব্য আপডেট করতে সমস্যা হয়েছে');
                }
            } else {
                // Create new comment
                const response = await api.comments.create(
                    {
                        content_id: contentId,
                        comment_text: commentText,
                        ...(parentCommentId && { parent_comment_id: parentCommentId })
                    });
                
                if (response.success) {
                    setCommentText('');
                    onCommentSubmitted?.();
                } else {
                    setError(response.error || 'মন্তব্য পোস্ট করতে সমস্যা হয়েছে');
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
            <div className="p-4 rounded-lg border-2 border-dashed text-center" style={{ borderColor: 'var(--reader-border)', color: 'var(--reader-secondary-text)' }}>
                <p className="text-sm bengali-text">মন্তব্য করতে লগইন করুন</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Comment Text */}
            <div className="flex gap-2">
                <img
                    src={user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=4F46E5&color=fff&size=40`}
                    alt={user.full_name || user.username}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={parentCommentId ? 2 : 3}
                        className="w-full px-3 py-2 rounded-lg border bengali-text focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        style={{
                            borderColor: 'var(--reader-border)',
                            backgroundColor: 'var(--reader-bg)',
                            color: 'var(--reader-text)'
                        }}
                        placeholder={placeholder}
                        disabled={loading}
                    />
                    
                    {/* Error Message */}
                    {error && (
                        <p className="text-sm text-red-600 mt-1 bengali-text">{error}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-2">
                        <button
                            type="submit"
                            disabled={loading || !commentText.trim()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium bengali-text hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>পোস্ট হচ্ছে...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>{existingComment ? 'আপডেট করুন' : parentCommentId ? 'উত্তর দিন' : 'মন্তব্য করুন'}</span>
                                </>
                            )}
                        </button>
                        {(existingComment || onCancel) && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 text-sm bengali-text transition-colors"
                                style={{ color: 'var(--reader-secondary-text)' }}
                                disabled={loading}
                            >
                                বাতিল
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
}
