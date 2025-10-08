'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, BookOpen, Send, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('ইমেইল প্রয়োজন');
      return;
    }

    if (!validateEmail(email)) {
      setError('বৈধ ইমেইল প্রয়োজন');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Password reset email sent to:', email);
      setEmailSent(true);
      
    } catch (error) {
      console.error('Password reset error:', error);
      setError('একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">ইমেইল পাঠানো হয়েছে!</h1>
              <p className="text-gray-600">
                আমরা <strong>{email}</strong> এ একটি পাসওয়ার্ড রিসেট লিংক পাঠিয়েছি।
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">পরবর্তী ধাপ:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• আপনার ইমেইল ইনবক্স চেক করুন</li>
                <li>• স্প্যাম ফোল্ডারও দেখুন</li>
                <li>• "পাসওয়ার্ড রিসেট" লিংকে ক্লিক করুন</li>
                <li>• নতুন পাসওয়ার্ড সেট করুন</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link 
                href="/login"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 inline-block text-center"
              >
                লগইন পেজে ফিরে যান
              </Link>
              
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="w-full text-gray-600 hover:text-gray-800 py-2"
              >
                অন্য ইমেইল ব্যবহার করুন
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">প্রতিধ্বনি</h1>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">পাসওয়ার্ড ভুলে গেছেন?</h2>
            <p className="text-gray-600">
              চিন্তা নেই! আপনার ইমেইল দিন, আমরা পাসওয়ার্ড রিসেট লিংক পাঠাবো।
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ইমেইল ঠিকানা
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="আপনার ইমেইল লিখুন"
                  required
                />
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  পাঠানো হচ্ছে...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  রিসেট লিংক পাঠান
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link 
              href="/login"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              লগইন পেজে ফিরে যান
            </Link>
          </div>

          {/* Additional Help */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              সমস্যা হচ্ছে? <a href="/support" className="text-blue-600 hover:underline">সাহায্য নিন</a> অথবা{' '}
              <a href="mailto:support@protiddhoni.com" className="text-blue-600 hover:underline">
                আমাদের সাথে যোগাযোগ করুন
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}