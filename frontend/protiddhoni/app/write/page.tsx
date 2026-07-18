/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  PlusCircle, 
  BookOpen, 
  Edit, 
  FileText, 
  Users,
  Star,
  Target,
  ChevronRight,
  Feather,
  Pen,
  Loader2,
  Link2
} from 'lucide-react';

interface UserStats {
  totalStories: number;
  totalWords: number;
  totalViews: number;
  totalLikes: number;
  drafts: number;
  published: number;
  weeklyTarget: number;
  weeklyProgress: number;
}

interface RecentActivity {
  id: string;
  action: 'published' | 'edited' | 'created';
  title: string;
  timestamp: string;
  type: string;
}

export default function WritingHubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    totalStories: 0,
    totalWords: 0,
    totalViews: 0,
    totalLikes: 0,
    drafts: 0,
    published: 0,
    weeklyTarget: 2000,
    weeklyProgress: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.content.getAuthorStats(user.id);
      if (response) {
        setUserStats(prev => ({
          ...prev,
          totalStories: response.totalContent || 0,
          totalWords: response.totalWords || 0,
          totalViews: response.totalViews || 0,
          totalLikes: response.totalRatings || 0,
          drafts: response.drafts || 0,
          published: response.published || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchRecentActivity = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.content.getRecentActivity(user.id, 5);
      if (response) {
        const activities = response.slice(0, 3).map((content: { id: string; title: string; type: string; action: string; timestamp: string }) => ({
          id: content.id,
          action: (content.action === 'published' ? 'published' : 'edited') as 'published' | 'edited' | 'created',
          title: content.title,
          timestamp: formatRelativeTime(content.timestamp),
          type: content.type
        }));
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchUserStats();
    fetchRecentActivity();
  }, [user, router, fetchUserStats, fetchRecentActivity]);

  const formatRelativeTime = (date: string) => {
    // Ensure UTC timestamps are parsed correctly
    const then = /Z|[+-]\d{2}:\d{2}$/.test(date) ? new Date(date) : new Date(date + 'Z');
    const now = new Date();
    const diffInMs = now.getTime() - then.getTime();
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSecs < 5) return 'এইমাত্র';
    if (diffInSecs < 60) return `${diffInSecs} সেকেন্ড আগে`;
    if (diffInMins < 60) return `${diffInMins} মিনিট আগে`;
    if (diffInHours < 24) return `${diffInHours} ঘন্টা আগে`;
    if (diffInDays === 1) return '১ দিন আগে';
    return `${diffInDays} দিন আগে`;
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

  const progressPercentage = (userStats.weeklyProgress / userStats.weeklyTarget) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bengali-text">
            লেখালেখির জগৎ
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => router.push('/write/editor')}
            className="bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <PlusCircle className="w-8 h-8 mb-3 mx-auto" />
            <h3 className="text-lg font-bold mb-2 bengali-text">নতুন লেখা</h3>
            <p className="text-sm opacity-90 bengali-text">একটি নতুন গল্প শুরু করুন</p>
          </button>

          <button
            onClick={() => router.push('/write/external')}
            className="bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Link2 className="w-8 h-8 mb-3 mx-auto" />
            <h3 className="text-lg font-bold mb-2 bengali-text">বাইরের লেখা</h3>
            <p className="text-sm opacity-90 bengali-text">অন্য সাইটে প্রকাশিত লেখা যুক্ত করুন</p>
          </button>

          {/* <button
            onClick={() => router.push('/write/continue')}
            className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Edit className="w-8 h-8 mb-3 mx-auto" />
            <h3 className="text-lg font-bold mb-2 bengali-text">চালিয়ে যান</h3>
            <p className="text-sm opacity-90 bengali-text">পূর্বের লেখা সম্পাদনা করুন</p>
          </button> */}

          <button
            onClick={() => router.push('/drafts')}
            className="bg-gradient-to-br from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <FileText className="w-8 h-8 mb-3 mx-auto" />
            <h3 className="text-lg font-bold mb-2 bengali-text">খসড়া</h3>
            <p className="text-sm opacity-90 bengali-text">অসম্পূর্ণ লেখাগুলি দেখুন</p>
          </button>

          {/* <button
            onClick={() => router.push('/write/settings')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Target className="w-8 h-8 mb-3 mx-auto" />
            <h3 className="text-lg font-bold mb-2 bengali-text">সেটিংস</h3>
            <p className="text-sm opacity-90 bengali-text">লেখার পছন্দ কাস্টমাইজ করুন</p>
          </button> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Writing Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 bengali-text">
                আপনার লেখালেখির পরিসংখ্যান
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.totalStories.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 bengali-text">মোট গল্প</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Pen className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.totalWords.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 bengali-text">মোট শব্দ</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-accent-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-accent-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.totalViews.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 bengali-text">মোট পাঠক</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.totalLikes.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 bengali-text">মোট পছন্দ</div>
                </div>
              </div>
            </div>

            {/* Weekly Progress
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 bengali-text">
                  সাপ্তাহিক লক্ষ্য
                </h2>
                <span className="text-sm text-gray-600 bengali-text">
                  {userStats.weeklyProgress} / {userStats.weeklyTarget} শব্দ
                </span>
              </div>
              
              <div className="bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-600 bengali-text">
                {progressPercentage >= 100 
                  ? '🎉 অভিনন্দন! আপনি এই সপ্তাহের লক্ষ্য অর্জন করেছেন!'
                  : `আরও ${userStats.weeklyTarget - userStats.weeklyProgress} শব্দ লিখুন লক্ষ্য অর্জনের জন্য`
                }
              </p>
            </div> */}

            {/* Writing Inspiration */}
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Feather className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900 bengali-text">
                  আজকের অনুপ্রেরণা
                </h2>
              </div>
              <blockquote className="text-lg text-gray-700 italic bengali-text mb-4">
                &ldquo;লেখা হলো চিন্তার সবচেয়ে শক্তিশালী অস্ত্র।&rdquo;
              </blockquote>
              <p className="text-sm text-gray-600 bengali-text">
                আজ কী লিখবেন? আপনার মনের কথা, একটি স্মৃতি, নাকি কোনো কল্পনার গল্প?
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 bengali-text">
                সাম্প্রতিক কার্যকলাপ
              </h3>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.action === 'published' ? 'bg-green-500' :
                      activity.action === 'edited' ? 'bg-primary-500' : 'bg-accent-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 bengali-text">
                        <span className="font-medium">{activity.title}</span>
                        <span className="text-gray-600 ml-1">
                          {activity.action === 'published' ? 'প্রকাশিত হয়েছে' :
                           activity.action === 'edited' ? 'সম্পাদিত হয়েছে' : 'তৈরি হয়েছে'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 bengali-text">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 bengali-text">
                দ্রুত লিংক
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/my-stories')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm text-gray-700 bengali-text">আমার সব গল্প</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button
                  onClick={() => router.push('/bookmarks')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm text-gray-700 bengali-text">বুকমার্ক</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button
                  onClick={() => router.push(user?.username ? `/profile/${user.username}` : '/login')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm text-gray-700 bengali-text">প্রোফাইল</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Writing Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 bengali-text">
                💡 লেখার টিপস
              </h3>
              <div className="space-y-2 text-sm text-gray-700 bengali-text">
                <p>• প্রতিদিন একটি নির্দিষ্ট সময় লেখার জন্য রাখুন</p>
                <p>• ছোট লক্ষ্য নির্ধারণ করুন এবং সেগুলো অর্জন করুন</p>
                <p>• আপনার চারপাশের পরিবেশ থেকে অনুপ্রেরণা নিন</p>
                <p>• অন্যদের লেখা পড়ুন এবং শিখুন</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}