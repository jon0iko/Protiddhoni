'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, 
  Clock, 
  Eye, 
  BookOpen, 
  Heart, 
  Share2,
  Loader2,
  Calendar,
  Tag,
  Crown,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import PaywallBlock from '@/components/reader/PaywallBlock';

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const slug = params.slug as string;

  const [content, setContent] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [paywallInfo, setPaywallInfo] = useState<any>(null);

  useEffect(() => {
    loadStoryData();
  }, [slug]);

  const loadStoryData = async () => {
    setLoading(true);
    setIsBlocked(false);
    setPaywallInfo(null);
    
    try {
      const response = await api.content.getBySlug(slug);
      
      // Check if content is blocked by paywall
      if (!response.success && response.isPremiumBlocked) {
        setIsBlocked(true);
        setPaywallInfo({
          title: response.contentDetails?.title || 'Premium Content',
          price: response.contentDetails?.price || 0,
          reason: response.reason,
          message: response.error
        });
        setLoading(false);
        return;
      }
      
      if (response.success) {
        setContent(response.data);
        
        // If it's a series, load all chapters
        if (response.data.series_id) {
          const seriesRes = await api.content.getPublished({
            series_id: response.data.series_id
          });
          if (seriesRes.success) {
            setChapters(seriesRes.data || []);
          }
        }
      } else {
        router.push('/404');
      }
    } catch (error: any) {
      console.error('Error loading story:', error);
      
      // Check if error response indicates paywall
      if (error?.response?.data?.isPremiumBlocked) {
        setIsBlocked(true);
        setPaywallInfo({
          title: error.response.data.contentDetails?.title || 'Premium Content',
          price: error.response.data.contentDetails?.price || 0,
          reason: error.response.data.reason,
          message: error.response.data.error
        });
      } else {
        router.push('/404');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push(`/login?redirect=/story/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Show paywall if content is blocked
  if (isBlocked && paywallInfo) {
    return (
      <PaywallBlock
        contentTitle={paywallInfo.title}
        price={paywallInfo.price}
        onLogin={handleLogin}
        isLoggedIn={isLoggedIn}
      />
    );
  }

  if (!content) return null;

  const authorName = content.author?.full_name || content.author?.username || 'Unknown Author';
  const categoryName = content.category?.name || 'General';

  const toggleBookmark = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    try {
      const isBookmarked = await api.bookmarks.checkBookmark(content.id);
      if (isBookmarked.isBookmarked) {
        await api.bookmarks.removeBookmark(content.id);
      } else {
        await api.bookmarks.addBookmark(content.id);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.excerpt,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('লিংক কপি হয়েছে!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <span className="bengali-text">← ফিরে যান</span>
          </Link>

          <div className="flex items-start gap-2 mb-4">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm bengali-text">
              {categoryName}
            </span>
            {content.is_premium && (
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded-full text-sm font-semibold">
                Premium
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 bengali-text leading-tight">
            {content.title}
          </h1>

          {content.excerpt && (
            <p className="text-xl text-white/90 mb-6 bengali-text leading-relaxed">
              {content.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-semibold">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium bengali-text">{authorName}</p>
              <p className="text-white/70 text-sm">
                {content.published_at && new Date(content.published_at).toLocaleDateString('bn-BD')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <span>{content.view_count?.toLocaleString() || 0} বার পড়া হয়েছে</span>
            </div>
            {chapters.length > 0 && (
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span className="bengali-text">{chapters.length} টি পর্ব</span>
              </div>
            )}
            {content.is_premium && content.price && (
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold">৳{content.price}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Link
              href={`/read/${slug}`}
              className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 bengali-text ${
                content.is_premium 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-lg' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              {content.is_premium && <Crown className="w-5 h-5" />}
              {!content.is_premium && <BookOpen className="w-5 h-5" />}
              পড়া শুরু করুন
            </Link>
            <button
              onClick={toggleBookmark}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              সেভ করুন
            </button>
            <button
              onClick={handleShare}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {chapters.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 bengali-text">
              সমস্ত পর্ব ({chapters.length})
            </h2>
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <Link
                  key={chapter.id}
                  href={`/read/${chapter.slug}`}
                  className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-100 hover:border-blue-200 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                          পর্ব {chapter.chapter_number || index + 1}
                        </span>
                        {chapter.is_premium && (
                          <span className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            Premium
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 bengali-text group-hover:text-blue-600 transition-colors">
                        {chapter.title}
                      </h3>
                      {chapter.excerpt && (
                        <p className="text-gray-600 bengali-text line-clamp-2">
                          {chapter.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-sm text-gray-500">
                      {chapter.view_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{chapter.view_count.toLocaleString()}</span>
                        </div>
                      )}
                      {chapter.published_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(chapter.published_at).toLocaleDateString('bn-BD')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
            <div 
              className="prose max-w-none bengali-text"
              dangerouslySetInnerHTML={{ __html: content.content_body || content.excerpt || '' }}
            />
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href={`/read/${slug}`}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors bengali-text"
              >
                <BookOpen className="w-5 h-5" />
                সম্পূর্ণ পড়ুন
              </Link>
            </div>
          </div>
        )}

        <div className="mt-12 bg-white rounded-xl shadow-md p-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 bengali-text">লেখক সম্পর্কে</h3>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 bengali-text mb-1">{authorName}</h4>
              {content.author?.bio && (
                <p className="text-gray-600 bengali-text mb-3">{content.author.bio}</p>
              )}
              <Link
                href={`/profile/${content.author?.username}`}
                className="text-blue-600 hover:text-blue-700 font-medium bengali-text"
              >
                প্রোফাইল দেখুন →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


