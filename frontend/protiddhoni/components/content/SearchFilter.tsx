'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function SearchFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [categories, setCategories] = useState<Category[]>([]);

    const [filters, setFilters] = useState({
        query: searchParams.get('query') || '',
        category: searchParams.get('category') || '',
        type: searchParams.get('type') || 'all',
        rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : 0,
        is_premium: searchParams.get('is_premium') === 'true',
        sort_by: searchParams.get('sort_by') || 'published_at',
        order: searchParams.get('order') || 'desc'
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.categories.getAll();
                setCategories(response.data || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleApplyFilters = () => {
        const params = new URLSearchParams();
        if (filters.query) params.set('query', filters.query);
        if (filters.category) params.set('category', filters.category);
        if (filters.type && filters.type !== 'all') params.set('type', filters.type);
        if (filters.rating > 0) params.set('rating', filters.rating.toString());
        if (filters.is_premium) params.set('is_premium', 'true');
        params.set('sort_by', filters.sort_by);
        params.set('order', filters.order);

        router.push(`/search?${params.toString()}`);
    };

    const handleReset = () => {
        setFilters({
            query: '',
            category: '',
            type: 'all',
            rating: 0,
            is_premium: false,
            sort_by: 'published_at',
            order: 'desc'
        });
        router.push('/search');
    };

    const activeFilterCount = [
        filters.query,
        filters.category,
        filters.type !== 'all' ? filters.type : null,
        filters.rating > 0 ? filters.rating : null,
        filters.is_premium ? true : null
    ].filter(Boolean).length;

    return (
        <div className="w-full md:w-72 h-fit md:sticky md:top-4 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 bengali-text">ফিল্টার</h2>
                {activeFilterCount > 0 && (
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-semibold">
                        {activeFilterCount}
                    </span>
                )}
            </div>
            
            <div className="space-y-6">
                {/* Title Search */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 bengali-text">শিরোনাম খুঁজুন</label>
                    <input 
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text text-black"
                        placeholder="গল্প, কবিতা খুঁজুন..." 
                        value={filters.query}
                        onChange={(e) => setFilters({...filters, query: e.target.value})}
                    />
                </div>

                {/* Category Dropdown */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 bengali-text">বিভাগ</label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text text-black"
                        value={filters.category} 
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                    >
                        <option value="">সব বিভাগ</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Content Type */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 bengali-text">ধরন</label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text text-black"
                        value={filters.type} 
                        onChange={(e) => setFilters({...filters, type: e.target.value})}
                    >
                        <option value="all">সব ধরনের</option>
                        <option value="story">গল্প</option>
                        <option value="poem">কবিতা</option>
                        <option value="series">সিরিজ</option>
                    </select>
                </div>

                {/* Min Rating */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 bengali-text">
                        ন্যূনতম রেটিং: {filters.rating}+ ⭐
                    </label>
                    <input 
                        type="range"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        min="0"
                        max="5"
                        step="1"
                        value={filters.rating}
                        onChange={(e) => setFilters({...filters, rating: parseInt(e.target.value)})}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>0</span>
                        <span>5</span>
                    </div>
                </div>

                {/* Premium Only */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <label htmlFor="premium-mode" className="text-sm font-semibold text-gray-700 bengali-text flex items-center gap-2">
                        
                        শুধু প্রিমিয়াম
                    </label>
                    <input 
                        type="checkbox"
                        id="premium-mode" 
                        checked={filters.is_premium}
                        onChange={(e) => setFilters({...filters, is_premium: e.target.checked})}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 bengali-text">সাজান</label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text text-black"
                        value={filters.sort_by} 
                        onChange={(e) => setFilters({...filters, sort_by: e.target.value})}
                    >
                        <option value="published_at">নতুন</option>
                        <option value="view_count">জনপ্রিয়</option>
                        <option value="title">শিরোনাম</option>
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                    <button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md bengali-text"
                        onClick={handleApplyFilters}
                    >
                        ফিল্টার প্রয়োগ করুন
                    </button>
                    <button 
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bengali-text"
                        onClick={handleReset}
                    >
                        <RotateCcw className="w-4 h-4" />
                        রিসেট করুন
                    </button>
                </div>
            </div>
        </div>
    );
}
