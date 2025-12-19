/**
 * Comment Card Component
 * Displays individual comments with nested replies
 */

'use client';

import { useState } from 'react';
import { MessageCircle, Edit2, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import CommentForm from './CommentForm';

interface Reply {
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
    replies?: Reply[];
}

interface CommentCardProps {
    comment: {
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
        replies?: Reply[];
    };
    contentId: string;
    onCommentUpdate: () => void;
    depth?: number;
}

export default function CommentCard({ comment, contentId, onCommentUpdate, depth = 0 }: CommentCardProps) {
    const { user, token } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showReplies, setShowReplies] = useState(true);

    const isOwner = user?.id === comment.user.id;
    const isAdmin = user?.is_admin === true;
    const canDelete = isOwner || isAdmin;
    const canEdit = isOwner;

    const handleDelete = async () => {
        if (!confirm('এই মন্তব্যটি মুছে ফেলতে চান?')) return;
        
        if (!token) {
            alert('লগইন করুন');
            return;
        }

        setDeleting(true);
        try {
            const response = await api.comments.delete(comment.id, token);
            if (response.success) {
                onCommentUpdate();
            } else {
                alert(response.error || 'মুছে ফেলতে সমস্যা হয়েছে');
            }
        } catch (err: any) {
            alert(err.message || 'কিছু একটা ভুল হয়েছে');
        } finally {
            setDeleting(false);
            setShowMenu(false);
        }
    };

    const handleEditComplete = () => {
        setIsEditing(false);
        onCommentUpdate();
    };

    const handleReplyComplete = () => {
        setIsReplying(false);
        onCommentUpdate();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'এইমাত্র';
        if (diffMins < 60) return `${diffMins} মিনিট আগে`;
        if (diffHours < 24) return `${diffHours} ঘন্টা আগে`;
        if (diffDays < 7) return `${diffDays} দিন আগে`;
        
        return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const maxDepth = 3; // Maximum nesting level for replies

    return (
        <div className="space-y-3" style={{ marginLeft: depth > 0 ? '2.5rem' : '0' }}>
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--reader-card-bg)', borderLeft: depth > 0 ? '2px solid var(--reader-border)' : 'none' }}>
                <div className="flex gap-3">
                    {/* User Avatar */}
                    <img
                        src={comment.user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.full_name || comment.user.username)}&background=4F46E5&color=fff&size=40`}
                        alt={comment.user.full_name || comment.user.username}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold bengali-text" style={{ color: 'var(--reader-text)' }}>
                                        {comment.user.full_name || comment.user.username}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>
                                    <span>{formatDate(comment.created_at)}</span>
                                    {comment.is_edited && (
                                        <>
                                            <span>•</span>
                                            <span>সম্পাদিত</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Action Menu */}
                            {(canEdit || canDelete) && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        disabled={deleting}
                                    >
                                        <MoreVertical className="w-4 h-4" style={{ color: 'var(--reader-secondary-text)' }} />
                                    </button>
                                    {showMenu && (
                                        <div 
                                            className="absolute right-0 mt-1 w-32 rounded-lg shadow-lg border z-10"
                                            style={{ backgroundColor: 'var(--reader-card-bg)', borderColor: 'var(--reader-border)' }}
                                        >
                                            {canEdit && (
                                                <button
                                                    onClick={() => {
                                                        setIsEditing(true);
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm bengali-text hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    style={{ color: 'var(--reader-text)' }}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    সম্পাদনা
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={deleting}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors bengali-text"
                                                >
                                                    {deleting ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            মুছছে...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Trash2 className="w-4 h-4" />
                                                            মুছুন
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Comment Content */}
                        {isEditing ? (
                            <CommentForm
                                contentId={contentId}
                                existingComment={{
                                    id: comment.id,
                                    comment_text: comment.comment_text
                                }}
                                onCommentSubmitted={handleEditComplete}
                                onCancel={() => setIsEditing(false)}
                            />
                        ) : (
                            <>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap bengali-text mb-3" style={{ color: 'var(--reader-text)' }}>
                                    {comment.comment_text}
                                </p>

                                {/* Reply Button */}
                                {user && depth < maxDepth && (
                                    <button
                                        onClick={() => setIsReplying(!isReplying)}
                                        className="flex items-center gap-1 text-xs bengali-text hover:underline transition-colors"
                                        style={{ color: 'var(--reader-secondary-text)' }}
                                    >
                                        <MessageCircle className="w-3 h-3" />
                                        উত্তর দিন
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Reply Form */}
            {isReplying && (
                <div className="ml-10">
                    <CommentForm
                        contentId={contentId}
                        parentCommentId={comment.id}
                        onCommentSubmitted={handleReplyComplete}
                        onCancel={() => setIsReplying(false)}
                        placeholder="উত্তর লিখুন..."
                    />
                </div>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-3">
                    {depth < maxDepth && (
                        <button
                            onClick={() => setShowReplies(!showReplies)}
                            className="text-xs bengali-text flex items-center gap-2 ml-10"
                            style={{ color: 'var(--reader-secondary-text)' }}
                        >
                            <MessageCircle className="w-3 h-3" />
                            {showReplies ? 'উত্তর লুকান' : `${comment.replies.length}টি উত্তর দেখুন`}
                        </button>
                    )}
                    {showReplies && comment.replies.map((reply) => (
                        <CommentCard
                            key={reply.id}
                            comment={reply}
                            contentId={contentId}
                            onCommentUpdate={onCommentUpdate}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
