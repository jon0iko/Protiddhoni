'use client';

import { useState } from 'react';
import { Mail, Bell, Check } from 'lucide-react';

export default function NewsletterSection() {
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            setIsSubscribed(true);
            setIsLoading(false);
            setEmail('');
        }, 1500);
    };

    return (
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center text-white">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                            <Bell className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 bengali-text">
                            নতুন গল্পের খবর পান
                        </h2>
                        <p className="text-xl text-blue-100 max-w-2xl mx-auto bengali-text leading-relaxed">
                            আমাদের নিউজলেটার সাবস্ক্রাইব করে প্রতি সপ্তাহে নতুন গল্প, কবিতা এবং ধারাবাহিকের আপডেট পান
                        </p>
                    </div>

                    {/* Subscription Form */}
                    {!isSubscribed ? (
                        <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="আপনার ইমেইল ঠিকানা"
                                        className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:outline-none bengali-text"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bengali-text"
                                >
                                    {isLoading ? 'সাবস্ক্রাইব হচ্ছে...' : 'সাবস্ক্রাইব করুন'}
                                </button>
                            </div>
                            <p className="text-blue-100 text-sm mt-3 bengali-text">
                                আমরা আপনার তথ্য সুরক্ষিত রাখি এবং স্প্যাম পাঠাই না
                            </p>
                        </form>
                    ) : (
                        <div className="max-w-md mx-auto">
                            <div className="bg-white/20 rounded-lg p-6 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mb-4">
                                    <Check className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 bengali-text">
                                    ধন্যবাদ!
                                </h3>
                                <p className="text-blue-100 bengali-text">
                                    আপনি সফলভাবে আমাদের নিউজলেটার সাবস্ক্রাইব করেছেন
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Features */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl bengali-text">📚</span>
                            </div>
                            <h3 className="font-semibold mb-2 bengali-text">নতুন প্রকাশনা</h3>
                            <p className="text-blue-100 text-sm bengali-text">
                                প্রতি সপ্তাহে নতুন গল্প ও কবিতার আপডেট
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl bengali-text">✍️</span>
                            </div>
                            <h3 className="font-semibold mb-2 bengali-text">লেখকদের সাক্ষাৎকার</h3>
                            <p className="text-blue-100 text-sm bengali-text">
                                জনপ্রিয় লেখকদের সাথে একান্ত আলাপচারিতা
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl bengali-text">🎯</span>
                            </div>
                            <h3 className="font-semibold mb-2 bengali-text">লেখার টিপস</h3>
                            <p className="text-blue-100 text-sm bengali-text">
                                উন্নত লেখালেখির জন্য পরামর্শ ও গাইড
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}