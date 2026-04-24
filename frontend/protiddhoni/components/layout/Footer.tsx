'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo and Description */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">প</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold bengali-text">প্রতিধ্বনি</h3>
                                {/* <p className="text-gray-400 text-sm">Protiddhoni</p> */}
                            </div>
                        </div>
                        <p className="text-gray-300 mb-4 bengali-text leading-relaxed">
                            বাংলা সাহিত্যের ডিজিটাল প্ল্যাটফর্ম। এখানে আপনি পড়তে পারেন হাজারো গল্প, কবিতা এবং ধারাবাহিক।
                            নিজের লেখাও প্রকাশ করুন এবং পাঠকদের সাথে যুক্ত হন।
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 bengali-text">দ্রুত লিংক</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="text-gray-300 hover:text-white transition-colors bengali-text">
                                    আমাদের সম্পর্কে
                                </Link>
                            </li>
                            <li>
                                <Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors bengali-text">
                                    কীভাবে কাজ করে
                                </Link>
                            </li>
                            <li>
                                <Link href="/guidelines" className="text-gray-300 hover:text-white transition-colors bengali-text">
                                    লেখালেখির নিয়মাবলী
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors bengali-text">
                                    প্রশ্নোত্তর
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors bengali-text">
                                    যোগাযোগ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 bengali-text">বিভাগসমূহ</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/category/romance" className="text-gray-300 hover:text-white transition-colors bengali-text">
                                    প্রেমের গল্প
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/horror" className="text-gray-300 hover:text-white transition-colors bengali-text">
                                    ভৌতিক
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/mystery" className="text-gray-300 hover:text-white transition-colors bengali-text">
                                    রহস্য
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/poetry" className="text-gray-300 hover:text-white transition-colors bengali-text">
                                    কবিতা
                                </Link>
                            </li>
                            <li>
                                <Link href="/category/social" className="text-gray-300 hover:text-white transition-colors bengali-text">
                                    সামাজিক
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm bengali-text mb-4 md:mb-0">
                        © ২০২৬ প্রতিধ্বনি। সকল অধিকার সংরক্ষিত।
                    </p>
                    <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
                        <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors bengali-text">
                            গোপনীয়তা নীতি
                        </Link>
                        <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors bengali-text">
                            ব্যবহারের শর্তাবলী
                        </Link>
                        {/* <div className="flex items-center space-x-1 text-gray-400 text-sm">
                            <span className="bengali-text">তৈরি করা হয়েছে</span>
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="bengali-text">দিয়ে বাংলাদেশে</span>
                        </div> */}
                    </div>
                </div>
            </div>
        </footer>
    );
}