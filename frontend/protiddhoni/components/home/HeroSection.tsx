'use client';

import Link from 'next/link';
import { BookOpen, Edit3 } from 'lucide-react';

export default function HeroSection() {
    return (
        <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="text-center">
                    {/* Main Heading */}
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 bengali-text">
                        <span className="text-gradient">বাংলা সাহিত্যের</span>
                        <br />
                        ডিজিটাল আবাসস্থল
                    </h1>
                    
                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto bengali-text leading-relaxed">
                        হাজারো গল্প, কবিতা আর ধারাবাহিকের জগতে স্বাগতম।<br />
                        পড়ুন, লিখুন এবং বাংলা সাহিত্যের অংশ হয়ে উঠুন।
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                        <Link 
                            href="/explore" 
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
                        >
                            <BookOpen className="w-5 h-5" />
                            <span className="bengali-text">পড়া শুরু করুন</span>
                        </Link>
                        <Link 
                            href="/write" 
                            className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-blue-600 transition-colors shadow-lg hover:shadow-xl"
                        >
                            <Edit3 className="w-5 h-5" />
                            <span className="bengali-text">লেখা শুরু করুন</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 z-10 opacity-30 overflow-hidden">
                {/* Top row */}
                <div className="absolute top-10 left-5 text-7xl text-gray-300 bengali-text font-light">প্র</div>
                <div className="absolute top-20 left-32 text-6xl text-gray-300 bengali-text font-light">তি</div>
                <div className="absolute top-12 left-1/2 text-8xl text-gray-300 bengali-text font-light">ধ্বনি</div>
                <div className="absolute top-24 right-32 text-5xl text-gray-300 bengali-text font-light">সা</div>
                <div className="absolute top-16 right-10 text-6xl text-gray-300 bengali-text font-light">হি</div>
                
                {/* Middle row */}
                <div className="absolute top-1/3 left-10 text-5xl text-gray-300 bengali-text font-light">তে</div>
                <div className="absolute top-1/2 right-20 text-7xl text-gray-300 bengali-text font-light">র</div>
                <div className="absolute top-2/5 left-1/4 text-6xl text-gray-300 bengali-text font-light">বাং</div>
                <div className="absolute top-1/3 right-1/3 text-8xl text-gray-300 bengali-text font-light">লা</div>
                
                {/* Bottom row */}
                <div className="absolute bottom-32 left-20 text-7xl text-gray-300 bengali-text font-light">ধ্ব</div>
                <div className="absolute bottom-20 left-1/3 text-6xl text-gray-300 bengali-text font-light">লা</div>
                <div className="absolute bottom-40 right-1/4 text-5xl text-gray-300 bengali-text font-light">নি</div>
                <div className="absolute bottom-24 right-10 text-8xl text-gray-300 bengali-text font-light">প্র</div>
                <div className="absolute bottom-32 right-40 text-6xl text-gray-300 bengali-text font-light">সা</div>
                
                {/* Additional scattered elements */}
                <div className="absolute top-2/3 left-1/2 text-5xl text-gray-300 bengali-text font-light">হি</div>
                <div className="absolute top-3/4 right-1/3 text-7xl text-gray-300 bengali-text font-light">তে</div>
            </div>
        </section>
    );
}