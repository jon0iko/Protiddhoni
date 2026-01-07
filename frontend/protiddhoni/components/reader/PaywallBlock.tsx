import React from 'react';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PaywallBlockProps {
  contentTitle: string;
  price: number;
  onLogin?: () => void;
  isLoggedIn?: boolean;
}

export default function PaywallBlock({ 
  contentTitle, 
  price, 
  onLogin, 
  isLoggedIn = false 
}: PaywallBlockProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Premium Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg">
            <Crown className="w-6 h-6" />
            <span className="font-bold text-lg">প্রিমিয়াম কন্টেন্ট</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header with Lock Icon */}
          <div className="bg-gradient-to-r from-accent-600 to-primary-600 text-white p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bengali-text">
              এই কন্টেন্টটি লক করা আছে
            </h1>
            <p className="text-white/90 text-lg bengali-text">
              {contentTitle}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-700 text-lg mb-4 bengali-text leading-relaxed">
                এই প্রিমিয়াম কন্টেন্টটি পড়তে হলে আপনাকে প্রথমে এটি কিনতে হবে।
                একবার কিনলে আপনি যেকোনো সময় এটি পড়তে পারবেন।
              </p>
              
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-accent-100 to-primary-100 px-8 py-4 rounded-xl mb-6">
                <span className="text-gray-600 bengali-text">মূল্য:</span>
                <span className="text-4xl font-bold text-accent-600">
                  ৳{price || 0}
                </span>
              </div>

              {!isLoggedIn && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 bengali-text mb-2">
                    ⚠️ কন্টেন্ট কিনতে হলে প্রথমে লগইন করুন
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={onLogin}
                    className="w-full bg-gradient-to-r from-accent-600 to-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 bengali-text"
                  >
                    লগইন করুন
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <Link
                    href="/register"
                    className="w-full block text-center border-2 border-accent-600 text-accent-600 py-4 rounded-xl font-bold text-lg hover:bg-accent-50 transition-all duration-200 bengali-text"
                  >
                    নতুন একাউন্ট তৈরি করুন
                  </Link>
                </>
              ) : (
                <>
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-600 py-4 rounded-xl font-bold text-lg cursor-not-allowed flex items-center justify-center gap-2 bengali-text"
                    title="পেমেন্ট গেটওয়ে শীঘ্রই যুক্ত হবে"
                  >
                    <Crown className="w-5 h-5" />
                    এখনই কিনুন (আসছে শীঘ্রই)
                  </button>
                  <p className="text-center text-sm text-gray-500 bengali-text">
                    পেমেন্ট গেটওয়ে শীঘ্রই যুক্ত করা হবে
                  </p>
                </>
              )}
              
              <Link
                href="/"
                className="w-full block text-center text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 bengali-text"
              >
                হোমপেজে ফিরে যান
              </Link>
            </div>
          </div>

          {/* Footer Info */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
            <div className="grid md:grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-accent-600 font-semibold mb-1 bengali-text">
                  ✓ লাইফটাইম এক্সেস
                </div>
                <div className="text-sm text-gray-600 bengali-text">
                  একবার কিনুন, সবসময় পড়ুন
                </div>
              </div>
              <div>
                <div className="text-accent-600 font-semibold mb-1 bengali-text">
                  ✓ লেখককে সাপোর্ট
                </div>
                <div className="text-sm text-gray-600 bengali-text">
                  সরাসরি লেখককে সহায়তা করুন
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-500 mt-6 text-sm bengali-text">
          কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন
        </p>
      </div>
    </div>
  );
}
