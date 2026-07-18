/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
/**
 * Enhanced Content Card Component
 * Displays content preview with better UI/UX
 */

import Link from 'next/link';
import { Star, Eye, Clock, Heart, CheckCircle, AlertCircle, XCircle, AlertTriangle, EyeOff, Headphones } from 'lucide-react';

interface ContentCardProps {
    content?: any;
    story?: any; // Legacy support
    showStatus?: boolean;
}

export default function ContentCard({ content, story, showStatus = false }: ContentCardProps) {
    // Support both content and story props for backwards compatibility
    const item = content || story;
    
    // Safety check
    if (!item) {
        return null;
    }
    
    const {
        title,
        excerpt,
        author,
        cover_image_url,
        coverImage,
        audio_url,
        slug,
        is_premium,
        isPremium,
        is_published,
        view_count,
        views,
        published_at,
        publishedAt,
        category,
        status,
        isSeries,
        chapters,
        rejection_reason
    } = item;

    const displayCoverImage = cover_image_url || coverImage;
    const displayViews = view_count || views || 0;
    const displayAuthor = author?.full_name || author?.username || author || 'Unknown';
    const displayCategory = category?.name || category;
    const isPremiumContent = is_premium || isPremium || false;
    const isSeriesContent = isSeries || false;
    const hasAudio = Boolean(audio_url || item.audioUrl);
    // Detect admin-unpublished content: status is approved but is_published is explicitly false
    const isUnpublished = is_published === false && status === 'approved';
    
    // Determine the link based on content type
    const linkHref = isSeriesContent ? `/series/${slug}` : `/read/${slug}`;
    
    // Render muted card for unpublished content (e.g. in bookmarks)
    if (isUnpublished) {
        return (
            <div className="block h-full cursor-not-allowed">
                <article className="bg-gray-100 rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full opacity-60">
                    {/* Unpublished Banner */}
                    <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-orange-800 bengali-text">
                            এই রচনাটি অপ্রকাশিত হয়েছে
                        </p>
                    </div>

                    {/* Image Section (muted) */}
                    <div className="relative h-48 flex-shrink-0 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                        {displayCoverImage ? (
                            <img 
                                src={displayCoverImage} 
                                alt={title}
                                className="w-full h-full object-cover grayscale"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-6xl text-gray-400 opacity-50 bengali-text">
                                    {(displayCategory && displayCategory.includes('কবিতা')) ? '🎭' : '📖'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex flex-col flex-grow">
                        <h3 className="text-xl font-bold text-gray-500 mb-3 bengali-text line-clamp-2">
                            {title}
                        </h3>
                        
                        {excerpt && (
                            <p className="text-gray-400 text-sm mb-4 line-clamp-3 bengali-text leading-relaxed">
                                {excerpt}
                            </p>
                        )}
                        
                        <div className="mt-auto">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                                    {displayAuthor.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 bengali-text">{displayAuthor}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        );
    }

    return (
        <Link href={linkHref} className="group block h-full">
            <article className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1 border border-gray-100 flex flex-col h-full">
                {/* Image Section */}
                <div className="relative h-48 flex-shrink-0 bg-gradient-to-br from-primary-100 to-accent-100 overflow-hidden">
                    {displayCoverImage ? (
                        <img 
                            src={displayCoverImage} 
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-6xl text-gray-300 opacity-50 bengali-text">
                                {(displayCategory && displayCategory.includes('কবিতা')) ? '🎭' : '📖'}
                            </div>
                        </div>
                    )}
                    
                    {/* Overlay Elements */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Category Badge */}
                    {displayCategory && (
                        <div className="absolute top-3 left-3">
                            <span className="bg-white/90 backdrop-blur-sm text-primary-600 px-3 py-1 rounded-full text-sm font-medium bengali-text shadow-sm">
                                {displayCategory}
                            </span>
                        </div>
                    )}

                    {/* Top-right Badges (Premium, Audio) */}
                    {(isPremiumContent || hasAudio) && (
                        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                            {isPremiumContent && (
                                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                                    Premium
                                </span>
                            )}
                            {hasAudio && (
                                <span className="flex items-center gap-1 bg-gradient-to-r from-olive-500 to-olive-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm bengali-text" title="অডিও শোনা যাবে">
                                    <Headphones className="w-3 h-3" />
                                    অডিও
                                </span>
                            )}
                        </div>
                    )}

                    {/* Series Badge */}
                    {isSeriesContent && (
                        <div className="absolute bottom-3 left-3">
                            <span className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm bengali-text">
                                ধারাবাহিক • {chapters || 0} অধ্যায়
                            </span>
                        </div>
                    )}

                    {/* Status Badge */}
                    {showStatus && status && (
                        <div className="absolute bottom-3 right-3">
                            {status === 'approved' && (
                                <span className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                                    <CheckCircle className="w-3 h-3" />
                                    প্রকাশিত
                                </span>
                            )}
                            {status === 'pending' && (
                                <span className="flex items-center gap-1 bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium">
                                    <AlertCircle className="w-3 h-3" />
                                    পর্যালোচনাধীন
                                </span>
                            )}
                            {status === 'rejected' && (
                                <span className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                                    <XCircle className="w-3 h-3" />
                                    প্রত্যাখ্যাত
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-grow">
                    {/* Rejection Reason Alert */}
                    {showStatus && status === 'rejected' && rejection_reason && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-red-800 mb-1 bengali-text">প্রত্যাখ্যানের কারণ:</p>
                                    <p className="text-sm text-red-700 bengali-text leading-relaxed">{rejection_reason}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 bengali-text group-hover:text-primary-600 transition-colors line-clamp-2">
                        {title}
                    </h3>
                    
                    {/* Excerpt */}
                    {excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 bengali-text leading-relaxed">
                            {excerpt}
                        </p>
                    )}
                    
                    <div className="mt-auto">
                        {/* Author */}
                        <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                                {displayAuthor.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 bengali-text">{displayAuthor}</p>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                {displayViews > 0 && (
                                    <div className="flex items-center space-x-1">
                                        <Eye className="w-4 h-4" />
                                        <span>{displayViews.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Read More Indicator */}
                        <div className="mt-4 flex items-center text-primary-600 font-medium text-sm group-hover:text-primary-700 transition-colors">
                            <span className="bengali-text">পড়ুন</span>
                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}
