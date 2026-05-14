/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  ArrowLeft, 
  Save, 
  Type, 
  Palette, 
  Settings as SettingsIcon,
  Globe,
  Bell,
  Shield,
  BookOpen,
  Loader2
} from 'lucide-react';

interface WritingSettings {
  fontSize: string;
  fontFamily: string;
  lineHeight: string;
  theme: 'light' | 'dark' | 'sepia';
  autoSave: boolean;
  spellCheck: boolean;
  wordCountTarget: number;
  defaultLanguage: string;
  notifications: {
    dailyReminder: boolean;
    weeklyGoal: boolean;
    publishSuccess: boolean;
  };
}

const fontOptions = [
  { value: 'kalpurush', label: 'কালপুরুষ' },
  { value: 'nikosh', label: 'নিকোশ' },
  { value: 'solaimanlipi', label: 'সোলাইমান লিপি' },
  { value: 'arial', label: 'Arial' },
  { value: 'georgia', label: 'Georgia' }
];

const themeOptions = [
  { value: 'light', label: 'উজ্জ্বল', bgColor: 'bg-white', textColor: 'text-gray-900' },
  { value: 'dark', label: 'অন্ধকার', bgColor: 'bg-gray-900', textColor: 'text-white' },
  { value: 'sepia', label: 'সেপিয়া', bgColor: 'bg-yellow-50', textColor: 'text-yellow-900' }
];

export default function WriteSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<WritingSettings>({
    fontSize: '16',
    fontFamily: 'kalpurush',
    lineHeight: '1.6',
    theme: 'light',
    autoSave: true,
    spellCheck: true,
    wordCountTarget: 500,
    defaultLanguage: 'bn',
    notifications: {
      dailyReminder: true,
      weeklyGoal: false,
      publishSuccess: true
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchSettings();
  }, [user, router]);

  const fetchSettings = async () => {
    try {
      const response = await (api as any).get(`/reading-preferences/${user?.id}`);
      if (response.data) {
        setSettings(prev => ({
          ...prev,
          theme: response.data.theme || 'light',
          fontSize: response.data.font_size || '16',
          fontFamily: response.data.font_family || 'kalpurush',
          lineHeight: response.data.line_height || '1.6'
        }));
      }
    } catch (error) {
      // If no preferences exist, use defaults
      console.log('No preferences found, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const preferences = {
        user_id: user?.id,
        theme: settings.theme,
        font_size: settings.fontSize,
        font_family: settings.fontFamily,
        line_height: settings.lineHeight
      };

      await (api as any).post('/reading-preferences', preferences);
      alert('সেটিংস সংরক্ষিত হয়েছে!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      
      // If already exists, try update
      if (error.response?.status === 409 || error.response?.status === 400) {
        try {
          const preferences = {
            theme: settings.theme,
            font_size: settings.fontSize,
            font_family: settings.fontFamily,
            line_height: settings.lineHeight
          };
          await (api as any).put(`/reading-preferences/${user?.id}`, preferences);
          alert('সেটিংস সংরক্ষিত হয়েছে!');
        } catch (updateError) {
          alert('সেটিংস সংরক্ষণে সমস্যা হয়েছে!');
        }
      } else {
        alert('সেটিংস সংরক্ষণে সমস্যা হয়েছে!');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (key: keyof WritingSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNotifications = (key: keyof WritingSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 bengali-text">
                  লেখার সেটিংস
                </h1>
                <p className="text-sm text-gray-600 bengali-text">
                  আপনার লেখার পছন্দ কাস্টমাইজ করুন
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors bengali-text disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ...' : 'সংরক্ষণ'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Writing Appearance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Type className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 bengali-text">
                লেখার চেহারা
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                  ফন্ট
                </label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => updateSettings('fontFamily', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                >
                  {fontOptions.map(font => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                  ফন্ট সাইজ
                </label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => updateSettings('fontSize', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                >
                  <option value="14">ছোট (১৪px)</option>
                  <option value="16">মাঝারি (১৬px)</option>
                  <option value="18">বড় (১৮px)</option>
                  <option value="20">খুব বড় (২০px)</option>
                </select>
              </div>

              {/* Line Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                  লাইনের ব্যবধান
                </label>
                <select
                  value={settings.lineHeight}
                  onChange={(e) => updateSettings('lineHeight', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                >
                  <option value="1.4">কম (১.৪)</option>
                  <option value="1.6">মাঝারি (১.৬)</option>
                  <option value="1.8">বেশি (১.৮)</option>
                  <option value="2.0">খুব বেশি (২.০)</option>
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                  থিম
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => updateSettings('theme', theme.value)}
                      className={`p-3 rounded-lg border-2 ${
                        settings.theme === theme.value 
                          ? 'border-blue-500' 
                          : 'border-gray-200'
                      } ${theme.bgColor} ${theme.textColor} transition-colors`}
                    >
                      <div className="text-xs font-medium bengali-text">
                        {theme.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Writing Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <SettingsIcon className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900 bengali-text">
                লেখার পছন্দ
              </h2>
            </div>

            <div className="space-y-6">
              {/* Auto Save */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 bengali-text">
                    স্বয়ংক্রিয় সংরক্ষণ
                  </h3>
                  <p className="text-sm text-gray-600 bengali-text">
                    লেখার সময় স্বয়ংক্রিয়ভাবে সংরক্ষণ করুন
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => updateSettings('autoSave', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {/* Spell Check */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 bengali-text">
                    বানান পরীক্ষা
                  </h3>
                  <p className="text-sm text-gray-600 bengali-text">
                    লেখার সময় বানান ভুল চিহ্নিত করুন
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.spellCheck}
                    onChange={(e) => updateSettings('spellCheck', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {/* Daily Word Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                  দৈনিক শব্দের লক্ষ্য
                </label>
                <input
                  type="number"
                  value={settings.wordCountTarget}
                  onChange={(e) => updateSettings('wordCountTarget', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="100"
                  max="5000"
                  step="50"
                />
                <p className="text-sm text-gray-600 mt-1 bengali-text">
                  প্রতিদিন কত শব্দ লিখতে চান?
                </p>
              </div>
            </div>
          </div>

          {/* Default Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900 bengali-text">
                ডিফল্ট সেটিংস
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Default Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                  ডিফল্ট ভাষা
                </label>
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => updateSettings('defaultLanguage', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                >
                  <option value="bn">বাংলা</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900 bengali-text">
                বিজ্ঞপ্তি
              </h2>
            </div>

            <div className="space-y-6">
              {/* Daily Reminder */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 bengali-text">
                    দৈনিক স্মরণিকা
                  </h3>
                  <p className="text-sm text-gray-600 bengali-text">
                    লেখার জন্য প্রতিদিন বিজ্ঞপ্তি পান
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.dailyReminder}
                    onChange={(e) => updateNotifications('dailyReminder', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Publish Success */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 bengali-text">
                    প্রকাশনার সফলতা
                  </h3>
                  <p className="text-sm text-gray-600 bengali-text">
                    গল্প প্রকাশিত হলে বিজ্ঞপ্তি পান
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.publishSuccess}
                    onChange={(e) => updateNotifications('publishSuccess', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}