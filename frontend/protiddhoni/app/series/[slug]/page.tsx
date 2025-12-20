'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, Clock, User, Calendar, Eye } from 'lucide-react';
import { api } from '@/lib/api';

export default function SeriesPage() {
    const params = useParams();
    const router = useRouter();
    const [series, setSeries] = useState<any>(null);
    const [chapters, setChapters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSeriesAndChapters = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const slug = params.slug as string;
                
                // First fetch series details by slug
                const seriesResponse = await api.series.getBySlug(slug);
                
                if (!seriesResponse.success || !seriesResponse.data) {
                    throw new Error('Series not found');
                }
                
                setSeries(seriesResponse.data);
                
                // Then fetch chapters using the series ID
                const chaptersResponse = await api.series.getChapters(seriesResponse.data.id);
                setChapters(chaptersResponse.data || []);
                
            } catch (err: any) {
                console.error('Error fetching series:', err);
                setError(err.message || 'Failed to load series');
            } finally {
                setLoading(false);
            }
        };

        if (params.slug) {
            fetchSeriesAndChapters();
        }
    }, [params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 bengali-text">লোড হচ্ছে...</p>
                </div>
            </div>
        );
    }

    if (error || !series) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 bengali-text mb-4">{error || 'সিরিজ খুঁজে পাওয়া যায়নি'}</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 bengali-text"
                    >
                        ফিরে যান
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Series Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Cover Image */}
                        <div className="md:col-span-1">
                            <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-2xl">
                                {series.cover_image_url ? (
                                    <img
                                        src={series.cover_image_url}
                                        alt={series.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                        <BookOpen className="w-24 h-24 text-white opacity-50" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Series Info */}
                        <div className="md:col-span-2">
                            <div className="mb-4">
                                {series.category && (
                                    <span className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-medium bengali-text mb-4">
                                        {series.category.name}
                                    </span>
                                )}
                                <h1 className="text-4xl font-bold mb-4 bengali-text">{series.title}</h1>
                            </div>

                            {/* Description */}
                            {series.description && (
                                <p className="text-white/90 text-lg mb-6 bengali-text leading-relaxed">
                                    {series.description}
                                </p>
                            )}

                            {/* Meta Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <BookOpen className="w-4 h-4" />
                                        <span className="text-sm font-medium bengali-text">অধ্যায়</span>
                                    </div>
                                    <p className="text-2xl font-bold">{series.total_chapters || 0}</p>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="w-4 h-4" />
                                        <span className="text-sm font-medium bengali-text">লেখক</span>
                                    </div>
                                    <p className="text-sm font-semibold truncate bengali-text">
                                        {series.author?.full_name || 'Unknown'}
                                    </p>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-medium bengali-text">স্ট্যাটাস</span>
                                    </div>
                                    <p className="text-sm font-semibold bengali-text">
                                        {series.is_completed ? 'সম্পূর্ণ' : 'চলমান'}
                                    </p>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-medium bengali-text">তারিখ</span>
                                    </div>
                                    <p className="text-sm font-semibold">
                                        {new Date(series.created_at).toLocaleDateString('bn-BD')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chapters List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 bengali-text">সকল অধ্যায়</h2>
                    <p className="text-gray-600 bengali-text">
                        {chapters.length}টি অধ্যায় পাওয়া গেছে
                    </p>
                </div>

                {chapters.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 bengali-text">এখনও কোন অধ্যায় প্রকাশিত হয়নি</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {chapters.map((chapter, index) => (
                            <button
                                key={chapter.id}
                                onClick={() => router.push(`/read/${chapter.slug}`)}
                                className="w-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-6 text-left group border border-gray-200 hover:border-purple-300"
                            >
                                <div className="flex items-start gap-6">
                                    {/* Chapter Number */}
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <span className="text-2xl font-bold text-white">
                                                {chapter.chapter_number || index + 1}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Chapter Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 bengali-text group-hover:text-purple-600 transition-colors">
                                            {chapter.title}
                                        </h3>
                                        {chapter.excerpt && (
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2 bengali-text">
                                                {chapter.excerpt}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            {chapter.view_count > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Eye className="w-4 h-4" />
                                                    <span>{chapter.view_count.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {chapter.published_at && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {new Date(chapter.published_at).toLocaleDateString('bn-BD')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Read Arrow */}
                                    <div className="flex-shrink-0 self-center">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 group-hover:bg-purple-600 flex items-center justify-center transition-colors">
                                            <svg
                                                className="w-5 h-5 text-purple-600 group-hover:text-white group-hover:translate-x-1 transition-all"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
