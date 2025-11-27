'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from '@/components/content/ContentCard';
import { api } from '@/lib/api';

const categories = [
    { name: 'সবগুলো', slug: 'all', active: true },
    { name: 'জনপ্রিয়', slug: 'popular', active: false },
    { name: 'নতুন', slug: 'latest', active: false },
    { name: 'প্রিমিয়াম', slug: 'premium', active: false }
];

export default function FeaturedContent() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [, setCurrentSlide] = useState(0);
    const [contents, setContents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoading(true);
                const filters: any = { limit: 6 };
                
                if (activeCategory === 'premium') {
                    filters.is_premium = 'true';
                }
                
                const response = await api.content.getPublished(filters);
                setContents(response.data || []);
            } catch (error) {
                console.error('Error fetching content:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [activeCategory]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % Math.ceil(contents.length / 3));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + Math.ceil(contents.length / 3)) % Math.ceil(contents.length / 3));
    };

    // Transform backend data to frontend format
    const transformContent = (content: any) => ({
        id: content.id,
        title: content.title,
        excerpt: content.excerpt || '',
        author: content.author?.full_name || 'Unknown',
        slug: content.slug,
        category: content.category?.name || '',
        coverImage: content.cover_image_url || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
        isPremium: content.is_premium || false,
        rating: content.stats?.averageRating || 0,
        views: content.view_count || 0,
        publishedAt: content.published_at ? new Date(content.published_at).toLocaleDateString('bn-BD') : '',
        readTime: '15 মিনিট',
        status: 'completed',
        chapters: 1,
        tags: [],
        totalRatings: content.stats?.totalReviews || 0,
        likes: 0
    });

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 bengali-text">
                        বিশেষ নির্বাচিত রচনা
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto bengali-text">
                        নির্বাচিত সেরা গল্প, কবিতা এবং ধারাবাহিক
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
                                    ? 'bg-blue-600 text-white'
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
                        <p className="text-gray-600 bengali-text">লোড হচ্ছে...</p>
                    </div>
                ) : contents.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 bengali-text">কোন রচনা পাওয়া যায়নি</p>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {contents.map((content) => (
                                <ContentCard
                                    key={content.id}
                                    story={transformContent(content)}
                                />
                            ))}
                        </div>

                        {/* Navigation Arrows */}
                        {contents.length > 3 && (
                            <>
                                <button
                                    onClick={prevSlide}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                                    aria-label="Previous"
                                >
                                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                                    aria-label="Next"
                                >
                                    <ChevronRight className="w-6 h-6 text-gray-600" />
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* View All Button */}
                <div className="text-center">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold bengali-text transition-colors">
                        আরও দেখুন
                    </button>
                </div>
            </div>
        </section>
    );
}