/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';


const colorMap: Record<string, string> = {
    'romance': 'from-accent-500 to-accent-600',
    'horror': 'from-olive-600 to-olive-700',
    'mystery': 'from-neutral-600 to-neutral-700',
    'poetry': 'from-primary-400 to-primary-500',
    'social': 'from-primary-600 to-primary-700',
    'comedy': 'from-primary-500 to-accent-500',
    'children': 'from-primary-400 to-primary-600',
    'historical': 'from-olive-500 to-olive-600',
    'sci-fi': 'from-accent-600 to-olive-600',
};

export default function CategoryShowcase() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.categories.getAll(true);
                setCategories(response.data || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <section className="py-16 bg-gradient-to-br from-gray-50 to-primary-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <p className="text-gray-600 bengali-text">লোড হচ্ছে...</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 bg-gradient-to-br from-gray-50 to-primary-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 bengali-text">
                        বিভাগ অনুযায়ী আবিষ্কার করুন
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto bengali-text">
                        আপনার পছন্দের ধরনের গল্প, কবিতা খুঁজে নিন
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category) => {
                        const colorClass = colorMap[category.slug] || 'from-primary-500 to-primary-600';
                        
                        return (
                            <Link
                                key={category.slug}
                                href={`/category/${category.slug}`}
                                className="group"
                            >
                                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
                                    {/* Header with gradient */}
                                    <div className={`bg-gradient-to-r ${colorClass} p-6 text-white`}>
                                        <div className="flex items-center justify-between mb-2">
                                            
                                            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
                                                {(category.contentCount || 0).toLocaleString()} টি
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold bengali-text">
                                            {category.name}
                                        </h3>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <p className="text-gray-600 bengali-text text-sm mb-4">
                                            {category.description}
                                        </p>
                                        <div className="flex items-center text-primary-600 font-medium text-sm group-hover:text-primary-700 transition-colors">
                                            <span className="bengali-text">আরও পড়ুন</span>
                                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
