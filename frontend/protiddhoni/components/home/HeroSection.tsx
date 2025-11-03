'use client';

import Link from 'next/link';
import { BookOpen, Edit3, Users, Award } from 'lucide-react';

export default function HeroSection() {
    return (
        <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">১,০০০+</h3>
                            <p className="text-gray-600 bengali-text">প্রকাশিত গল্প ও কবিতা</p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">৫,০০+</h3>
                            <p className="text-gray-600 bengali-text">সক্রিয় লেখক ও পাঠক</p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">৫০০+</h3>
                            <p className="text-gray-600 bengali-text">পুরস্কারপ্রাপ্ত রচনা</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 -z-10 opacity-5">
                <div className="absolute top-20 left-10 text-8xl text-gray-400 bengali-text">প</div>
                <div className="absolute top-40 right-20 text-6xl text-gray-400 bengali-text">র</div>
                <div className="absolute bottom-40 left-20 text-7xl text-gray-400 bengali-text">তি</div>
                <div className="absolute bottom-20 right-10 text-5xl text-gray-400 bengali-text">ধ্বনি</div>
            </div>
        </section>
    );
}