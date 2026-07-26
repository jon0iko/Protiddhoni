/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

interface TopAuthor {
    id: string;
    username: string;
    full_name?: string | null;
    profile_picture_url?: string | null;
    total_views?: number;
    article_count?: number;
}

const SCROLL_STEP = 300;

export default function AuthorReel() {
    const [authors, setAuthors] = useState<TopAuthor[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchAuthors = async () => {
            try {
                const response = await api.users.getTopAuthors(10);
                setAuthors(response.data || []);
            } catch (error) {
                console.error('Error fetching top authors:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAuthors();
    }, []);

    const scrollBy = (amount: number) => {
        scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
    };

    // The reel is a nice-to-have, not load-bearing: on a fresh database (or a
    // failed fetch) render nothing at all rather than an empty shell.
    if (loading || authors.length === 0) {
        return null;
    }

    return (
        <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 bengali-text">
                        জনপ্রিয় লেখকগণ
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto bengali-text">
                        সবচেয়ে বেশি পড়া হয়েছে যাঁদের লেখা
                    </p>
                </div>

                <div className="relative">
                    {/* Avatar Reel */}
                    <div
                        ref={scrollRef}
                        className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide py-2 px-1"
                    >
                        {authors.map((author) => {
                            const displayName = author.full_name || author.username;

                            return (
                                <Link
                                    key={author.id}
                                    href={`/profile/${author.username}`}
                                    className="group flex-shrink-0 w-24 flex flex-col items-center text-center"
                                >
                                    <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-200 group-hover:ring-primary-500 transition-all duration-300 group-hover:-translate-y-1 shadow-sm group-hover:shadow-md">
                                        <img
                                            src={
                                                author.profile_picture_url ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4F46E5&color=fff&size=160`
                                            }
                                            alt={displayName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className="mt-3 text-sm font-medium text-gray-900 bengali-text line-clamp-2 group-hover:text-primary-600 transition-colors">
                                        {displayName}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Navigation Arrows */}
                    {authors.length > 4 && (
                        <>
                            <button
                                onClick={() => scrollBy(-SCROLL_STEP)}
                                className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 transition-all hover:bg-gray-50 hover:shadow-xl"
                                aria-label="Previous authors"
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-600" />
                            </button>
                            <button
                                onClick={() => scrollBy(SCROLL_STEP)}
                                className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 transition-all hover:bg-gray-50 hover:shadow-xl"
                                aria-label="Next authors"
                            >
                                <ChevronRight className="w-6 h-6 text-gray-600" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
