/**
 * Enhanced Content Card Component
 * Displays content preview with better UI/UX
 */

import Link from 'next/link';
import { Star, Eye, Clock, Heart, CheckCircle, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';

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
        slug,
        is_premium,
        isPremium,
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
    
    // Determine the link based on content type
    const linkHref = isSeriesContent ? `/series/${slug}` : `/read/${slug}`;
    
    return (
        <Link href={linkHref} className="group block">
            <article className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1 border border-gray-100">
                {/* Image Section */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
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
                            <span className="bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-sm font-medium bengali-text shadow-sm">
                                {displayCategory}
                            </span>
                        </div>
                    )}

                    {/* Premium Badge */}
                    {isPremiumContent && (
                        <div className="absolute top-3 right-3">
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                                Premium
                            </span>
                        </div>
                    )}

                    {/* Series Badge */}
                    {isSeriesContent && (
                        <div className="absolute bottom-3 left-3">
                            <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm bengali-text">
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
                <div className="p-6">
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
                    <h3 className="text-xl font-bold text-gray-900 mb-3 bengali-text group-hover:text-blue-600 transition-colors line-clamp-2">
                        {title}
                    </h3>
                    
                    {/* Excerpt */}
                    {excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 bengali-text leading-relaxed">
                            {excerpt}
                        </p>
                    )}
                    
                    {/* Author */}
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
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
                    <div className="mt-4 flex items-center text-blue-600 font-medium text-sm group-hover:text-blue-700 transition-colors">
                        <span className="bengali-text">পড়ুন</span>
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </article>
        </Link>
    );
}
