'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from '@/components/content/ContentCard';
import { api } from '@/lib/api';

const categories = [
    { name: 'সবগুলো', slug: 'all' },
    { name: 'জনপ্রিয়', slug: 'popular' },
    { name: 'নতুন', slug: 'latest' },
    { name: 'প্রিমিয়াম', slug: 'premium' }
];

const ITEMS_PER_PAGE = 9; // 3 rows of 3 items each

export default function FeaturedContent() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [contents, setContents] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalContents, setTotalContents] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoading(true);
                const filters: any = {};
                
                // Apply category-specific filters (without pagination - fetch all)
                if (activeCategory === 'premium') {
                    filters.is_premium = 'true';
                    filters.sort_by = 'published_at';
                    filters.order = 'desc';
                } else if (activeCategory === 'popular') {
                    filters.sort_by = 'view_count';
                    filters.order = 'desc';
                } else if (activeCategory === 'latest') {
                    filters.sort_by = 'created_at';
                    filters.order = 'desc';
                } else {
                    // Default for 'all'
                    filters.sort_by = 'published_at';
                    filters.order = 'desc';
                }
                
                // Fetch both standalone content and series (all data, no pagination)
                const [contentResponse, seriesResponse] = await Promise.all([
                    api.content.getPublished(filters),
                    // Don't fetch series for premium category since series don't have premium status
                    activeCategory === 'premium' ? Promise.resolve({ data: [] }) : api.series.getPublished(filters)
                ]);
                
                // Combine and mark series items
                const contentItems = (contentResponse.data || []).map((item: any) => ({
                    ...item,
                    itemType: 'content'
                }));
                
                const seriesItems = (seriesResponse.data || []).map((item: any) => ({
                    ...item,
                    itemType: 'series'
                }));
                
                // Merge and re-sort based on the selected sorting criteria
                let allItems = [...contentItems, ...seriesItems];
                
                if (activeCategory === 'popular') {
                    allItems.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
                } else if (activeCategory === 'latest') {
                    allItems.sort((a, b) => {
                        const dateA = new Date(a.created_at).getTime();
                        const dateB = new Date(b.created_at).getTime();
                        return dateB - dateA;
                    });
                } else {
                    allItems.sort((a, b) => {
                        const dateA = new Date(a.published_at || a.created_at).getTime();
                        const dateB = new Date(b.published_at || b.created_at).getTime();
                        return dateB - dateA;
                    });
                }
                
                // Calculate pagination for combined results
                const totalItems = allItems.length;
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                const endIndex = startIndex + ITEMS_PER_PAGE;
                const paginatedItems = allItems.slice(startIndex, endIndex);
                
                setContents(paginatedItems);
                setTotalContents(totalItems);
                setTotalPages(Math.ceil(totalItems / ITEMS_PER_PAGE));
            } catch (error) {
                console.error('Error fetching content:', error);
                setContents([]);
                setTotalContents(0);
                setTotalPages(0);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [activeCategory, currentPage]);

    // Reset to page 1 when category changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory]);

    const nextSlide = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevSlide = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    // Transform backend data to frontend format
    const transformContent = (item: any) => {
        const isSeries = item.itemType === 'series';
        
        if (isSeries) {
            return {
                id: item.id,
                title: item.title,
                excerpt: item.description || '',
                author: item.author?.full_name || 'Unknown',
                slug: item.slug,
                category: item.category?.name || '',
                coverImage: item.cover_image_url || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
                isPremium: false,
                rating: 0,
                views: 0,
                publishedAt: item.created_at ? new Date(item.created_at).toLocaleDateString('bn-BD') : '',
                readTime: `${item.total_chapters || 0} টি অধ্যায়`,
                status: item.is_completed ? 'completed' : 'ongoing',
                chapters: item.total_chapters || 0,
                tags: [],
                totalRatings: 0,
                likes: 0,
                isSeries: true
            };
        } else {
            return {
                id: item.id,
                title: item.title,
                excerpt: item.excerpt || '',
                author: item.author?.full_name || 'Unknown',
                slug: item.slug,
                category: item.category?.name || '',
                coverImage: item.cover_image_url || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
                isPremium: item.is_premium || false,
                rating: item.stats?.averageRating || 0,
                views: item.view_count || 0,
                publishedAt: item.published_at ? new Date(item.published_at).toLocaleDateString('bn-BD') : '',
                readTime: '15 মিনিট',
                status: 'completed',
                chapters: 1,
                tags: [],
                totalRatings: item.stats?.totalReviews || 0,
                likes: 0,
                isSeries: false
            };
        }
    };

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 bengali-text">
                        সকল রচনা
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto bengali-text">
                        আমাদের প্ল্যাটফর্মের সকল গল্প, কবিতা এবং ধারাবাহিক রচনা
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {categories.map((category) => (
                        <button
                            key={category.slug}
                            onClick={() => setActiveCategory(category.slug)}
                            className={`px-6 py-2 rounded-full font-medium bengali-text transition-colors ${
                                activeCategory === category.slug
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 bengali-text mt-4">লোড হচ্ছে...</p>
                    </div>
                ) : totalContents === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 bengali-text text-lg">কোন রচনা পাওয়া যায়নি</p>
                    </div>
                ) : (
                    <>
                        <div className="relative min-h-[600px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {contents.map((content) => (
                                    <ContentCard
                                        key={content.id}
                                        story={transformContent(content)}
                                    />
                                ))}
                            </div>

                            {/* Navigation Arrows */}
                            {totalPages > 1 && (
                                <>
                                    <button
                                        onClick={prevSlide}
                                        disabled={currentPage === 1}
                                        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 transition-all ${
                                            currentPage === 1
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:bg-gray-50 hover:shadow-xl'
                                        }`}
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        disabled={currentPage === totalPages}
                                        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 transition-all ${
                                            currentPage === totalPages
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:bg-gray-50 hover:shadow-xl'
                                        }`}
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="w-6 h-6 text-gray-600" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Pagination Info */}
                        <div className="text-center mt-8">
                            <p className="text-gray-600 bengali-text mb-4">
                                পৃষ্ঠা {currentPage} এর {totalPages} • মোট {totalContents}টি রচনা
                            </p>
                            
                            {/* Page Numbers */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2">
                                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 7) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 4) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 3) {
                                            pageNum = totalPages - 6 + i;
                                        } else {
                                            pageNum = currentPage - 3 + i;
                                        }
                                        
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-10 h-10 rounded-full font-medium transition-colors ${
                                                    currentPage === pageNum
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}