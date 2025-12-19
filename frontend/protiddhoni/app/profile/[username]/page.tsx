'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  MapPin, 
  Calendar, 
  Edit, 
  Settings, 
  BookOpen, 
  Heart, 
  Users,
  Share2,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import ContentList from '@/components/content/ContentList';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isLoggedIn } = useAuth();
  const username = params.username as string;

  const [profile, setProfile] = useState<any>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('published');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (username) {
      console.log('Loading profile for username:', username);
      loadProfile();
    }
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      console.log('Fetching profile for:', username);
      const profileRes = await api.users.getProfile(username);
      console.log('Profile response:', profileRes);

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
        setIsFollowing(profileRes.data.isFollowing || false);
        
        // Fetch contents separately to avoid blocking profile display
        try {
          const contentsRes = await api.users.getContent(username);
          if (contentsRes.success && contentsRes.data) {
            setContents(contentsRes.data || []);
          }
        } catch (contentError) {
          console.error('Error loading contents:', contentError);
          // Continue even if contents fail
        }
      } else {
        console.error('Profile not found or error:', profileRes);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      if (isFollowing) {
        await api.users.unfollow(profile.id, token);
      } else {
        await api.users.follow(profile.id, token);
      }

      setIsFollowing(!isFollowing);
      loadProfile(); // Reload to update follower count
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const isOwnProfile = currentUser?.username === username;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ব্যবহারকারী পাওয়া যায়নি</h1>
          <p className="text-gray-600 mb-4">এই ব্যবহারকারী নাম বিদ্যমান নেই।</p>
          <p className="text-sm text-gray-500">Username: {username}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username)}&background=4F46E5&color=fff&size=120`}
                alt={profile.full_name || profile.username}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg"
              />
              {profile.is_verified && (
                <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    {profile.full_name || profile.username}
                  </h1>
                  <p className="text-gray-600">@{profile.username}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>সম্পাদনা</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleFollow}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                          isFollowing
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                        <span>{isFollowing ? 'অনুসরণ করা হচ্ছে' : 'অনুসরণ করুন'}</span>
                      </button>
                      <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 mb-4 bengali-text">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span><strong className="text-gray-900">{profile.stats?.contentCount || 0}</strong> রচনা</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span><strong className="text-gray-900">{profile.stats?.followerCount || 0}</strong> অনুসারী</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span><strong className="text-gray-900">{profile.stats?.followingCount || 0}</strong> অনুসরণ</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>যোগদান {new Date(profile.created_at).toLocaleDateString('bn-BD')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('published')}
                className={`pb-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'published'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                প্রকাশিত রচনা
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('drafts')}
                  className={`pb-4 font-medium border-b-2 transition-colors ${
                    activeTab === 'drafts'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  খসড়া
                </button>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {contents.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">কোনো রচনা নেই</h3>
            <p className="text-gray-500">
              {isOwnProfile 
                ? 'আপনার প্রথম রচনা লিখুন এবং শেয়ার করুন!' 
                : 'এই ব্যবহারকারী এখনো কোনো রচনা প্রকাশ করেননি।'}
            </p>
            {isOwnProfile && (
              <Link
                href="/write/editor"
                className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                লেখা শুরু করুন
              </Link>
            )}
          </div>
        ) : (
          <ContentList contents={contents} />
        )}
      </div>
    </div>
  );
}
