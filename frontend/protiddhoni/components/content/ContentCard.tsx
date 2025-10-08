/**
 * Enhanced Content Card Component
 * Displays content preview with better UI/UX
 */

import Link from 'next/link';
import { Star, Eye, Clock, Heart } from 'lucide-react';

interface Story {
    id: string;
    title: string;
    slug: string;
    author: string;
    excerpt: string;
    coverImage: string;
    rating: number;
    totalRatings?: number;
    views: number;
    readTime: string;
    publishedAt: string;
    status: string;
    chapters: number;
    tags: string[];
    isPremium: boolean;
    isNew?: boolean;
    isTrending?: boolean;
    category?: string;
    likes?: number;
}

interface ContentCardProps {
    story: Story;
}

export default function ContentCard({ story }: ContentCardProps) {
    // Safety check for undefined story
    if (!story) {
        return null;
    }
    
    const {
        title,
        excerpt,
        author,
        coverImage,
        slug,
        isPremium,
        rating = 0,
        views = 0,
        publishedAt = '',
        tags = [],
        category,
        totalRatings = 0,
        likes = 0
    } = story;
    return (
        <Link href={`/story/${slug}`} className="group block">
            <article className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1 border border-gray-100">
                {/* Image Section */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                    {coverImage ? (
                        <img 
                            src={coverImage} 
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-6xl text-gray-300 opacity-50 bengali-text">
                                {(category && category === 'কবিতা') ? '🎭' : '📖'}
                            </div>
                        </div>
                    )}
                    
                    {/* Overlay Elements */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Category Badge */}
                    {category && (
                        <div className="absolute top-3 left-3">
                            <span className="bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-sm font-medium bengali-text shadow-sm">
                                {category}
                            </span>
                        </div>
                    )}

                    {/* Premium Badge */}
                    {isPremium && (
                        <div className="absolute top-3 right-3">
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                                Premium
                            </span>
                        </div>
                    )}

                    {/* Quick Stats on Hover */}
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center space-x-3 text-white text-sm">
                            {rating > 0 && (
                                <div className="flex items-center space-x-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded">
                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                    <span>{rating}</span>
                                </div>
                            )}
                            {views > 0 && (
                                <div className="flex items-center space-x-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded">
                                    <Eye className="w-3 h-3" />
                                    <span>{views.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
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
                            {author && author.charAt ? author.charAt(0) : '?'}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 bengali-text">{author || 'অজানা লেখক'}</p>
                            {publishedAt && (
                                <p className="text-xs text-gray-500 bengali-text">{publishedAt}</p>
                            )}
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {rating > 0 && (
                                <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span>{rating}</span>
                                </div>
                            )}
                            {views > 0 && (
                                <div className="flex items-center space-x-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{views.toLocaleString()}</span>
                                </div>
                            )}
                            {publishedAt && (
                                <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="bengali-text">{publishedAt}</span>
                                </div>
                            )}
                        </div>
                        
                        {likes > 0 && (
                            <div className="flex items-center space-x-1 text-sm text-red-500">
                                <Heart className="w-4 h-4 fill-current" />
                                <span>{likes}</span>
                            </div>
                        )}
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
