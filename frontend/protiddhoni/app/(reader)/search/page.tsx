/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchFilter from '@/components/content/SearchFilter';
import ContentList from '@/components/content/ContentList';
import { api } from '@/lib/api';
import { Search, Filter } from 'lucide-react';

function SearchResults() {
    const searchParams = useSearchParams();
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError('');
            try {
                const params: any = {};
                searchParams.forEach((value, key) => {
                    params[key] = value;
                });
                
                const result = await api.content.search(params);
                setContents(result.data || []);
                setTotal(result.count || 0);
            } catch (error) {
                console.error('Error fetching search results:', error);
                setError('Failed to load search results. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [searchParams]);

    if (loading) {
        return (
            <div className="flex-1">
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 bengali-text text-lg">খুঁজছি...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1">
                <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 bengali-text">সমস্যা হয়েছে</h3>
                    <p className="text-gray-600 bengali-text text-center">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 bengali-text">
                    অনুসন্ধানের ফলাফল
                </h1>
                <div className="flex items-center gap-2 text-gray-600">
                    <Search className="w-5 h-5" />
                    <p className="bengali-text text-lg">
                        {total > 0 ? `${total.toLocaleString()} টি ফলাফল পাওয়া গেছে` : 'কোনো ফলাফল পাওয়া যায়নি'}
                    </p>
                </div>
            </div>

            {contents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-gray-400 text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2 bengali-text">কোনো রচনা পাওয়া যায়নি</h3>
                    <p className="text-gray-500 bengali-text text-center max-w-md">
                        আপনার অনুসন্ধান মানদণ্ড পরিবর্তন করে আবার চেষ্টা করুন অথবা ফিল্টার রিসেট করুন
                    </p>
                </div>
            ) : (
                <ContentList contents={contents} />
            )}
        </div>
    );
}

export default function SearchPage() {
    const [showFilters, setShowFilters] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Mobile Filter Toggle */}
                <div className="md:hidden mb-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow border border-gray-200 w-full justify-center bengali-text font-medium"
                    >
                        <Filter className="w-5 h-5" />
                        {showFilters ? 'ফিল্টার লুকান' : 'ফিল্টার দেখান'}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
                        <Suspense fallback={
                            <div className="w-64 h-96 bg-white rounded-lg animate-pulse"></div>
                        }>
                            <SearchFilter />
                        </Suspense>
                    </div>

                    {/* Results */}
                    <Suspense fallback={
                        <div className="flex-1 flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    }>
                        <SearchResults />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
