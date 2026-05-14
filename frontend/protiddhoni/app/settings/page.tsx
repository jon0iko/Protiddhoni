/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Image, FileText, Save, Loader2, CheckCircle, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

  // Push notification state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushToggling, setPushToggling] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

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

  // Check push notification status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setPushSupported(supported);
    if (!supported) return;

    setPushPermission(Notification.permission);

    navigator.serviceWorker.ready.then((registration) => {
      return registration.pushManager.getSubscription();
    }).then((subscription) => {
      setPushSubscribed(!!subscription);
    }).catch(() => {});
  }, []);

  const handlePushToggle = async () => {
    setPushToggling(true);
    try {
      if (pushSubscribed) {
        // Unsubscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await api.push.unsubscribe(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setPushSubscribed(false);
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        if (permission !== 'granted') return;

        const vapidResponse = await api.push.getVapidPublicKey();
        if (!vapidResponse.success || !vapidResponse.key) {
          console.error('Failed to get VAPID key');
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidResponse.key) as any,
        });

        const subJson = subscription.toJSON();
        await api.push.subscribe({
          endpoint: subJson.endpoint!,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          },
        });
        setPushSubscribed(true);
      }
    } catch (error) {
      console.error('Push toggle error:', error);
    } finally {
      setPushToggling(false);
    }
  };

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

      await api.users.updateProfile(user.id, formData);
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

        {/* Push Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            বিজ্ঞপ্তি সেটিংস
          </h2>

          {!pushSupported ? (
            <p className="text-sm text-gray-500">
              আপনার ব্রাউজার পুশ বিজ্ঞপ্তি সমর্থন করে না।
            </p>
          ) : pushPermission === 'denied' ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <BellOff className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">বিজ্ঞপ্তি ব্লক করা হয়েছে</p>
                <p className="text-xs text-red-600 mt-1">
                  ব্রাউজার সেটিংস থেকে এই সাইটের জন্য বিজ্ঞপ্তি অনুমতি দিন।
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">পুশ বিজ্ঞপ্তি</p>
                <p className="text-sm text-gray-500">
                  {pushSubscribed
                    ? 'নতুন লেখা প্রকাশিত হলে বিজ্ঞপ্তি পাবেন'
                    : 'বিজ্ঞপ্তি চালু করুন নতুন লেখার খবর পেতে'}
                </p>
              </div>
              <button
                onClick={handlePushToggle}
                disabled={pushToggling}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  pushSubscribed ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    pushSubscribed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
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
                  {(user as any)?.created_at ? new Date((user as any).created_at).toLocaleDateString('bn-BD', {
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
