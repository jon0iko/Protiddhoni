'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, CheckCircle, BookOpen } from 'lucide-react';

interface LogoutPageProps {
  onLogout?: () => void;
}

export default function LogoutPage({ onLogout }: LogoutPageProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Simulate logout process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear any stored authentication data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        sessionStorage.clear();
      }
      
      // Call custom logout function if provided
      if (onLogout) {
        onLogout();
      }
      
      setIsLoggedOut(true);
      
      // Redirect to home page after a brief delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoggedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center p-8">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">সফলভাবে লগআউট হয়েছে!</h1>
            <p className="text-gray-600">আপনাকে শীঘ্রই হোম পেজে নিয়ে যাওয়া হবে...</p>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="h-12 w-12 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">প্রতিধ্বনি</h1>
          </div>

          {/* Logout Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">লগআউট করতে চান?</h2>
            <p className="text-gray-600">
              আপনি কি নিশ্চিত যে আপনি আপনার একাউন্ট থেকে লগআউট করতে চান?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  লগআউট হচ্ছে...
                </>
              ) : (
                <>
                  <LogOut className="h-5 w-5 mr-2" />
                  হ্যাঁ, লগআউট করুন
                </>
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={isLoggingOut}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              বাতিল করুন
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>মনে রাখবেন:</strong> লগআউট করার পর আপনার সেশন শেষ হয়ে যাবে এবং 
              আবার লগইন করতে হবে।
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            সমস্যা হচ্ছে? <a href="/support" className="text-blue-600 hover:underline">সাহায্য নিন</a>
          </p>
        </div>
      </div>
    </div>
  );
}