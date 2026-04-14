'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
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

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled && !subscription) {
          setShowBanner(true);
        }
      } catch (err) {
        console.error('Push subscription check failed:', err);
      }
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user]);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setShowBanner(false);
        return;
      }

      // Get VAPID public key from backend
      const vapidResponse = await api.push.getVapidPublicKey();
      if (!vapidResponse.success || !vapidResponse.key) {
        console.error('Failed to get VAPID key');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidResponse.key),
      });

      // Send subscription to backend
      const subJson = subscription.toJSON();
      await api.push.subscribe({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
      });

      setShowBanner(false);
    } catch (error) {
      console.error('Push subscription failed:', error);
    } finally {
      setSubscribing(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 bengali-text">
            বিজ্ঞপ্তি চালু করুন
          </p>
          <p className="text-xs text-gray-600 mt-1 bengali-text">
            আপনার প্রিয় লেখকের নতুন লেখা প্রকাশিত হলে সাথে সাথে জানতে পারবেন
          </p>
          <div className="flex items-center space-x-2 mt-3">
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 bengali-text"
            >
              {subscribing ? 'অপেক্ষা করুন...' : 'চালু করুন'}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="px-3 py-1.5 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-100 transition-colors bengali-text"
            >
              পরে
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
