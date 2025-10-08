'use client';

import Link from 'next/link';
import { Heart, Ghost, Search, BookOpen, Users, Laugh, Baby, Clock } from 'lucide-react';

const categories = [
    {
        name: 'প্রেমের গল্প',
        slug: 'romance',
        description: 'ভালোবাসার অনুভূতিময় গল্প',
        icon: Heart,
        color: 'from-pink-500 to-rose-500',
        count: 2850
    },
    {
        name: 'ভৌতিক',
        slug: 'horror',
        description: 'রহস্যময় ও রোমাঞ্চকর গল্প',
        icon: Ghost,
        color: 'from-purple-500 to-indigo-500',
        count: 1200
    },
    {
        name: 'রহস্য',
        slug: 'mystery',
        description: 'থ্রিলিং ও রহস্য ভরা কাহিনী',
        icon: Search,
        color: 'from-gray-500 to-slate-500',
        count: 980
    },
    {
        name: 'কবিতা',
        slug: 'poetry',
        description: 'হৃদয়ছোঁয়া কাব্য রচনা',
        icon: BookOpen,
        color: 'from-emerald-500 to-teal-500',
        count: 3200
    },
    {
        name: 'সামাজিক',
        slug: 'social',
        description: 'সমাজ ও জীবনের বাস্তব চিত্র',
        icon: Users,
        color: 'from-blue-500 to-cyan-500',
        count: 1800
    },
    {
        name: 'হাস্যরস',
        slug: 'comedy',
        description: 'মজার ও হাসির গল্প',
        icon: Laugh,
        color: 'from-yellow-500 to-orange-500',
        count: 750
    },
    {
        name: 'শিশুতোষ',
        slug: 'children',
        description: 'ছোটদের জন্য বিশেষ গল্প',
        icon: Baby,
        color: 'from-green-500 to-lime-500',
        count: 650
    },
    {
        name: 'ঐতিহাসিক',
        slug: 'historical',
        description: 'ইতিহাসের পাতা থেকে',
        icon: Clock,
        color: 'from-amber-500 to-yellow-500',
        count: 420
    }
];

export default function CategoryShowcase() {
    return (
        <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
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
                        const IconComponent = category.icon;
                        return (
                            <Link
                                key={category.slug}
                                href={`/category/${category.slug}`}
                                className="group"
                            >
                                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
                                    {/* Header with gradient */}
                                    <div className={`bg-gradient-to-r ${category.color} p-6 text-white`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <IconComponent className="w-8 h-8" />
                                            <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
                                                {category.count.toLocaleString()} টি
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
                                        <div className="flex items-center text-blue-600 font-medium text-sm group-hover:text-blue-700 transition-colors">
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

                {/* Popular Tags */}
                <div className="mt-12 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 bengali-text">
                        জনপ্রিয় ট্যাগসমূহ
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            'প্রেম', 'বিরহ', 'পরিবার', 'বন্ধুত্ব', 'স্বপ্ন', 'যুদ্ধ',
                            'গ্রাম', 'শহর', 'প্রকৃতি', 'রাত', 'বৃষ্টি', 'সূর্যাস্ত'
                        ].map((tag, index) => (
                            <Link
                                key={index}
                                href={`/tag/${tag}`}
                                className="bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 px-4 py-2 rounded-full border border-gray-200 hover:border-blue-200 transition-colors text-sm bengali-text"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}