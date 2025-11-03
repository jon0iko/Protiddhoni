'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from '@/components/content/ContentCard';

// Mock data - replace with actual data from API
const featuredContent = [
    {
        id: '1',
        title: 'অন্তরালের গল্প',
        excerpt: 'একটি রহস্যময় প্রেমের গল্প যা আপনাকে মুগ্ধ করবে...',
        author: 'রফিকুল ইসলাম',
        slug: 'ontoraler-golpo',
        category: 'প্রেমের গল্প',
        coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
        isPremium: false,
        rating: 4.8,
        views: 12500,
        publishedAt: '২ দিন আগে',
        readTime: '15 মিনিট',
        status: 'completed',
        chapters: 1,
        tags: ['প্রেম', 'রহস্য'],
        totalRatings: 250,
        likes: 85
    },
    {
        id: '2',
        title: 'মায়ের চিঠি',
        excerpt: 'একটি মর্মস্পর্শী গল্প যা প্রতিটি সন্তানের হৃদয় ছুঁয়ে যাবে...',
        author: 'সুমিত্রা দেবী',
        slug: 'mayer-chithi',
        category: 'সামাজিক',
        coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
        isPremium: true,
        rating: 4.9,
        views: 8900,
        publishedAt: '৫ দিন আগে',
        readTime: '20 মিনিট',
        status: 'completed',
        chapters: 1,
        tags: ['সামাজিক', 'পারিবারিক'],
        totalRatings: 189,
        likes: 156
    },
    {
        id: '3',
        title: 'রাতের নিঃশব্দতা',
        excerpt: 'একটি ভৌতিক রহস্য যা আপনার রাতের ঘুম কেড়ে নেবে...',
        author: 'মাহমুদুল হক',
        slug: 'rater-nishobdota',
        category: 'ভৌতিক',
        coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
        isPremium: false,
        rating: 4.7,
        views: 15600,
        publishedAt: '১ সপ্তাহ আগে',
        readTime: '25 মিনিট',
        status: 'completed',
        chapters: 1,
        tags: ['ভৌতিক', 'রহস্য', 'রাত'],
        totalRatings: 312,
        likes: 203
    },
    {
        id: '4',
        title: 'বসন্তের কবিতা',
        excerpt: 'প্রকৃতির সৌন্দর্য নিয়ে লেখা একটি মনোমুগ্ধকর কবিতা...',
        author: 'নাসির উদ্দিন',
        slug: 'boshonter-kobita',
        category: 'কবিতা',
        coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
        isPremium: false,
        rating: 4.6,
        views: 6700,
        publishedAt: '৩ দিন আগে',
        readTime: '5 মিনিট',
        status: 'completed',
        chapters: 1,
        tags: ['কবিতা', 'প্রকৃতি', 'বসন্ত'],
        totalRatings: 134,
        likes: 78
    }
];

const categories = [
    { name: 'সবগুলো', slug: 'all', active: true },
    { name: 'জনপ্রিয়', slug: 'popular', active: false },
    { name: 'নতুন', slug: 'latest', active: false },
    { name: 'প্রিমিয়াম', slug: 'premium', active: false }
];

export default function FeaturedContent() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredContent.length / 3));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + Math.ceil(featuredContent.length / 3)) % Math.ceil(featuredContent.length / 3));
    };

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
                <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {featuredContent.map((content) => (
                            <ContentCard
                                key={content.id}
                                story={content}
                            />
                        ))}
                    </div>

                    {/* Navigation Arrows */}
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
                </div>

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