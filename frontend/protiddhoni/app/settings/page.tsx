'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Image, FileText, Save, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { user, isLoggedIn, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    profile_picture_url: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/settings');
    } else if (user) {
      setFormData({
        full_name: user.full_name || '',
        bio: user.bio || '',
        profile_picture_url: user.profile_picture_url || ''
      });
    }
  }, [isLoggedIn, isLoading, user]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setSaved(false);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await api.users.updateProfile(user.id, formData, token);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('প্রোফাইল আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">সেটিংস</h1>
          <p className="text-gray-600">আপনার প্রোফাইল এবং অ্যাকাউন্ট সেটিংস পরিচালনা করুন</p>
        </div>

        {/* Profile Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            প্রোফাইল তথ্য
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                পূর্ণ নাম
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="আপনার পূর্ণ নাম"
              />
            </div>

            {/* Username (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ব্যবহারকারী নাম
              </label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">ব্যবহারকারী নাম পরিবর্তন করা যাবে না</p>
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                ইমেইল
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">ইমেইল পরিবর্তন করা যাবে না</p>
            </div>

            {/* Profile Picture URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Image className="w-4 h-4" />
                প্রোফাইল ছবি URL
              </label>
              <input
                type="url"
                value={formData.profile_picture_url}
                onChange={(e) => handleChange('profile_picture_url', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="https://example.com/image.jpg"
              />
              {formData.profile_picture_url && (
                <div className="mt-3">
                  <img
                    src={formData.profile_picture_url}
                    alt="Profile Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                জীবনী
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                placeholder="আপনার সম্পর্কে কিছু লিখুন..."
                maxLength={500}
              />
              <p className="mt-1 text-sm text-gray-500 text-right">
                {formData.bio.length}/500
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>সংরক্ষণ করুন</span>
                  </>
                )}
              </button>

              {saved && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>সংরক্ষিত হয়েছে!</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            অ্যাকাউন্ট তথ্য
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">অ্যাকাউন্ট স্ট্যাটাস</p>
                <p className="text-sm text-gray-500">আপনার অ্যাকাউন্ট সক্রিয় আছে</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                সক্রিয়
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">যাচাইকরণ স্ট্যাটাস</p>
                <p className="text-sm text-gray-500">
                  {user?.is_verified ? 'আপনার অ্যাকাউন্ট যাচাই করা হয়েছে' : 'অ্যাকাউন্ট যাচাই হয়নি'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user?.is_verified 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user?.is_verified ? 'যাচাইকৃত' : 'যাচাই হয়নি'}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">সদস্য হয়েছেন</p>
                <p className="text-sm text-gray-500">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('bn-BD', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
