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
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import ReadingControls from '@/components/reader/ReadingControls';
import RatingWidget from '@/components/reader/RatingWidget';
import CommentList from '@/components/reader/CommentList';

export default function ReadContentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const slug = params.slug as string;

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [seriesChapters, setSeriesChapters] = useState<any[]>([]);
  const [prevChapter, setPrevChapter] = useState<any>(null);
  const [nextChapter, setNextChapter] = useState<any>(null);

  useEffect(() => {
    loadContent();
  }, [slug]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await api.content.getBySlug(slug);
      if (response.success) {
        setContent(response.data);
        
        // If this is a chapter in a series, load all chapters for navigation
        if (response.data.series_id) {
          const chaptersResponse = await api.series.getChapters(response.data.series_id);
          if (chaptersResponse.success) {
            const chapters = chaptersResponse.data || [];
            setSeriesChapters(chapters);
            
            // Find prev and next chapters
            const currentIndex = chapters.findIndex((ch: any) => ch.id === response.data.id);
            if (currentIndex > 0) {
              setPrevChapter(chapters[currentIndex - 1]);
            } else {
              setPrevChapter(null);
            }
            if (currentIndex < chapters.length - 1) {
              setNextChapter(chapters[currentIndex + 1]);
            } else {
              setNextChapter(null);
            }
          }
        }
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--reader-bg)', color: 'var(--reader-text)' }}>
      {/* Header Navigation */}
      <div className="border-b sticky top-0 z-40" style={{ backgroundColor: 'var(--reader-bg)', borderColor: 'var(--reader-border)' }}>
        <div className="container mx-auto px-4 py-3 max-w-5xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 transition-colors"
              style={{ color: 'var(--reader-secondary-text)' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--reader-text)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--reader-secondary-text)'}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>পিছনে</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--reader-secondary-text)' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--reader-hover)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="শেয়ার করুন"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--reader-secondary-text)' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--reader-hover)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="বুকমার্ক"
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current text-blue-600' : ''}`} />
              </button>
              <button
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--reader-secondary-text)' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--reader-hover)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
        {/* Reading Controls */}
        <div className="mb-6 flex justify-center sticky top-16 z-30">
          <ReadingControls />
        </div>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bengali-text leading-tight" style={{ color: 'var(--reader-text)' }}>
            {content.title}
          </h1>
          
          {content.excerpt && (
            <p className="text-xl mb-6 bengali-text" style={{ color: 'var(--reader-secondary-text)' }}>{content.excerpt}</p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm mb-6" style={{ color: 'var(--reader-secondary-text)' }}>
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
            
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{content.view_count || 0} বার পড়া হয়েছে</span>
            </div>
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
            lineHeight: '1.8',
            fontSize: 'var(--current-reader-font-size, var(--reader-font-medium))',
            color: 'var(--reader-text)'
          }}
          dangerouslySetInnerHTML={{ __html: content.body }}
        />

        {/* Series Navigation */}
        {content.series_id && (
          <div className="border-t pt-8 mb-8" style={{ borderColor: 'var(--reader-border)' }}>
            <h3 className="text-xl font-bold mb-4 bengali-text" style={{ color: 'var(--reader-text)' }}>এই সিরিজের অন্যান্য পর্ব</h3>
            <div className="flex gap-4">
              {prevChapter ? (
                <button 
                  onClick={() => router.push(`/read/${prevChapter.slug}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-black"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="bengali-text">আগের পর্ব</span>
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-lg text-gray-400 cursor-not-allowed">
                  <ChevronLeft className="w-5 h-5" />
                  <span className="bengali-text">আগের পর্ব</span>
                </div>
              )}
              <Link
                href={`/series/${content.series?.slug}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <span className="bengali-text">সকল পর্ব দেখুন</span>
              </Link>
              {nextChapter ? (
                <button 
                  onClick={() => router.push(`/read/${nextChapter.slug}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-black"
                >
                  <span className="bengali-text">পরবর্তী পর্ব</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-lg text-gray-400 cursor-not-allowed">
                  <span className="bengali-text">পরবর্তী পর্ব</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Author Bio */}
        <div className="rounded-lg p-6 mb-8" style={{ backgroundColor: 'var(--reader-card-bg)' }}>
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

        {/* Rating Section */}
        <div className="mb-8">
          <RatingWidget contentId={content.id} />
        </div>

        {/* Comments Section */}
        <div className="border-t pt-8" style={{ borderColor: 'var(--reader-border)' }}>
          <CommentList contentId={content.id} />
        </div>
      </article>
    </div>
  );
}
