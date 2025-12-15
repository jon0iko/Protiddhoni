'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Heart, 
  Bookmark, 
  Share2, 
  Eye, 
  Star, 
  User,
  Calendar,
  Clock,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function ReadContentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const slug = params.slug as string;

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    loadContent();
  }, [slug]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await api.content.getBySlug(slug);
      if (response.success) {
        setContent(response.data);
      } else {
        // Content not found
        router.push('/404');
      }
    } catch (error) {
      console.error('Error loading content:', error);
      router.push('/404');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.excerpt || content.title,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('লিংক কপি করা হয়েছে!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 max-w-5xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>পিছনে</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="শেয়ার করুন"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="বুকমার্ক"
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current text-blue-600' : ''}`} />
              </button>
              <button
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="পছন্দ"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bengali-text leading-tight">
            {content.title}
          </h1>
          
          {content.excerpt && (
            <p className="text-xl text-gray-600 mb-6 bengali-text">{content.excerpt}</p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <Link 
              href={`/profile/${content.author.username}`}
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <img
                src={content.author.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(content.author.full_name || content.author.username)}&background=4F46E5&color=fff&size=40`}
                alt={content.author.full_name || content.author.username}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="font-medium text-gray-900">{content.author.full_name || content.author.username}</div>
                <div className="text-xs">@{content.author.username}</div>
              </div>
            </Link>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(content.published_at || content.created_at).toLocaleDateString('bn-BD')}</span>
            </div>
            
            {content.stats && (
              <>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{content.view_count || 0} বার পড়া হয়েছে</span>
                </div>
                {content.stats.averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{content.stats.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Categories/Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {content.category && (
              <Link
                href={`/category/${content.category.slug}`}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                {content.category.name}
              </Link>
            )}
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {content.content_type === 'story' && 'গল্প'}
              {content.content_type === 'poem' && 'কবিতা'}
              {content.content_type === 'chapter' && 'পর্ব'}
            </span>
          </div>

          {/* Cover Image */}
          {content.cover_image_url && (
            <div className="mb-8 rounded-lg overflow-hidden flex justify-center">
              <img
                src={content.cover_image_url}
                alt={content.title}
                className="w-100% h-100% "
              />
            </div>
          )}
        </header>

        {/* Content Body */}
        <div 
          className="prose prose-lg max-w-none bengali-text mb-12"
          style={{
            fontFamily: 'var(--font-kalpurush), sans-serif',
            lineHeight: '1.8'
          }}
          dangerouslySetInnerHTML={{ __html: content.body }}
        />

        {/* Series Navigation */}
        {content.series_id && (
          <div className="border-t border-gray-200 pt-8 mb-8">
            <h3 className="text-xl font-bold mb-4">এই সিরিজের অন্যান্য পর্ব</h3>
            <div className="flex gap-4">
              {content.chapter_number > 1 && (
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                  <span>আগের পর্ব</span>
                </button>
              )}
              <Link
                href={`/series/${content.series?.slug}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <span>সকল পর্ব দেখুন</span>
              </Link>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <span>পরবর্তী পর্ব</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Author Bio */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <img
              src={content.author.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(content.author.full_name || content.author.username)}&background=4F46E5&color=fff&size=80`}
              alt={content.author.full_name || content.author.username}
              className="w-16 h-16 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <Link 
                  href={`/profile/${content.author.username}`}
                  className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {content.author.full_name || content.author.username}
                </Link>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  অনুসরণ করুন
                </button>
              </div>
              {content.author.bio && (
                <p className="text-gray-600 mb-3">{content.author.bio}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-500">
                <span>{content.author.stats?.contentCount || 0} রচনা</span>
                <span>{content.author.stats?.followersCount || 0} অনুসারী</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-2xl font-bold mb-6">পাঠকদের মতামত</h3>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>মতামত বিভাগ শীঘ্রই আসছে...</p>
          </div>
        </div>
      </article>
    </div>
  );
}
