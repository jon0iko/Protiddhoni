/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TippingWidget from '@/components/reader/TippingWidget';
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
  Loader2,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import ReadingControls from '@/components/reader/ReadingControls';
import RatingWidget from '@/components/reader/RatingWidget';
import CommentList from '@/components/reader/CommentList';
import PaywallBlock from '@/components/reader/PaywallBlock';
import AudioPlayer from '@/components/reader/AudioPlayer';

export default function ReadContentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoggedIn, refreshBalance } = useAuth();
  const slug = params.slug as string;

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [seriesChapters, setSeriesChapters] = useState<any[]>([]);
  const [prevChapter, setPrevChapter] = useState<any>(null);
  const [nextChapter, setNextChapter] = useState<any>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [paywallInfo, setPaywallInfo] = useState<any>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [unpublishReason, setUnpublishReason] = useState('');
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  useEffect(() => {
    loadContent();
  }, [slug]);

  useEffect(() => {
    if (content && isLoggedIn) {
      const fetchInteractionStates = async () => {
        try {
          const [bookmarkRes, likeRes] = await Promise.all([
            api.bookmarks.checkBookmark(content.id),
            api.likes.checkLike(content.id)
          ]);
          setIsBookmarked(bookmarkRes.success && bookmarkRes.isBookmarked);
          setIsLiked(likeRes.success && likeRes.isLiked);
        } catch (error) {
          console.error('Error fetching interactions state:', error);
        }
      };
      fetchInteractionStates();
    }
  }, [content, isLoggedIn]);

  useEffect(() => {
    if (!content?.author?.username) {
      setAuthorProfile(null);
      setIsFollowing(false);
      return;
    }

    const fetchAuthorProfile = async () => {
      try {
        const profileRes = await api.users.getProfile(content.author.username);
        if (profileRes.success && profileRes.data) {
          setAuthorProfile(profileRes.data);
          setIsFollowing(Boolean(profileRes.data.isFollowing));
          return;
        }
      } catch (error) {
        console.error('Error loading author profile for reader card:', error);
      }

      // Fallback to content payload when profile endpoint fails.
      setAuthorProfile(content.author);
      setIsFollowing(Boolean(content.author?.isFollowing));
    };

    fetchAuthorProfile();
  }, [content?.author?.username, isLoggedIn]);

  // Loads the sibling chapters of a series for prev/next navigation. Runs in the
  // background (not blocking the article render) and owns its own error handling.
  const loadSeriesChapters = async (seriesId: string, currentContentId: string) => {
    try {
      const chaptersResponse = await api.series.getChapters(seriesId);
      if (!chaptersResponse.success) return;

      const chapters = chaptersResponse.data || [];
      setSeriesChapters(chapters);

      const currentIndex = chapters.findIndex((ch: any) => ch.id === currentContentId);
      setPrevChapter(currentIndex > 0 ? chapters[currentIndex - 1] : null);
      setNextChapter(currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null);
    } catch (error) {
      console.error('Error loading series chapters:', error);
    }
  };

  const loadContent = async () => {
    setLoading(true);
    setIsBlocked(false);
    setPaywallInfo(null);
    
    try {
      const response = await api.content.getBySlug(slug);
      
      // Check if content is blocked by paywall
      if (!response.success && response.isPremiumBlocked) {
        setIsBlocked(true);
        setPaywallInfo({
          id: response.contentDetails?.id,
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
        setIsFollowing(response.data.author?.isFollowing || false);

        // If this is a chapter in a series, load chapters for navigation in the
        // background. Not awaited here so the article renders immediately instead
        // of waiting on a second round-trip; the prev/next nav fills in shortly.
        if (response.data.series_id) {
          loadSeriesChapters(response.data.series_id, response.data.id);
        }
      } else {
        // Content not found
        router.push('/404');
      }
    } catch (error: any) {
      console.error('Error loading content:', error);
      
      // Check if error response indicates paywall
      if (error?.response?.data?.isPremiumBlocked) {
        setIsBlocked(true);
        setPaywallInfo({
          id: error.response.data.contentDetails?.id,
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
    router.push(`/login?redirect=/read/${slug}`);
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

  const handleFollow = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (!content?.author?.id || isFollowLoading) {
      return;
    }

    const previousFollowing = isFollowing;

    setIsFollowLoading(true);
    setIsFollowing(!previousFollowing);
    setAuthorProfile((prev: any) => {
      if (!prev) return prev;

      const nextFollowerCount = Math.max(
        0,
        (prev.stats?.followerCount || prev.stats?.followersCount || 0) + (previousFollowing ? -1 : 1)
      );

      return {
        ...prev,
        isFollowing: !previousFollowing,
        stats: {
          ...prev.stats,
          followerCount: nextFollowerCount,
          followersCount: nextFollowerCount
        }
      };
    });

    try {
      if (previousFollowing) {
        await api.users.unfollow(content.author.id);
      } else {
        await api.users.follow(content.author.id);
      }

      if (content.author.username) {
        const profileRes = await api.users.getProfile(content.author.username);
        if (profileRes.success && profileRes.data) {
          setAuthorProfile(profileRes.data);
          setIsFollowing(Boolean(profileRes.data.isFollowing));
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowing(previousFollowing);
      setAuthorProfile((prev: any) => {
        if (!prev) return prev;

        const rollbackFollowerCount = Math.max(
          0,
          (prev.stats?.followerCount || prev.stats?.followersCount || 0) + (previousFollowing ? 1 : -1)
        );

        return {
          ...prev,
          isFollowing: previousFollowing,
          stats: {
            ...prev.stats,
            followerCount: rollbackFollowerCount,
            followersCount: rollbackFollowerCount
          }
        };
      });
      alert('সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/read/' + slug);
      return;
    }
    try {
      if (isBookmarked) {
        await api.bookmarks.removeBookmark(content.id);
        setIsBookmarked(false);
      } else {
        await api.bookmarks.addBookmark(content.id);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/read/' + slug);
      return;
    }
    try {
      if (isLiked) {
        await api.likes.removeLike(content.id);
        setIsLiked(false);
      } else {
        await api.likes.addLike(content.id);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handlePurchase = async () => {
    if (!paywallInfo || !isBlocked) return;

    try {
      setIsPurchasing(true);
      const contentId = content?.id || paywallInfo.id;
      if (!contentId) {
        throw new Error('সামগ্রী ID পাওয়া যায়নি');
      }
      const response = await api.purchases.purchaseContent(contentId, paywallInfo.price);
      
      if (!response?.success) {
        throw new Error(response?.error || response?.message || 'ক্রয় ব্যর্থ হয়েছে');
      }

      // Refresh balance from server to ensure accuracy
      await refreshBalance();
      
      // Success! Reload content to remove paywall
      alert(response.message || 'সাফল্যপূর্ণ ক্রয়!');
      loadContent();
    } catch (error: any) {
      const errorMsg = error?.message || 'ক্রয় ব্যর্থ হয়েছে';
      alert(errorMsg);
      console.error('Purchase error:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleUnpublishSubmit = async () => {
    if (!content?.id) return;
    setIsUnpublishing(true);
    try {
      const res = await api.content.unpublish(content.id, unpublishReason || undefined);
      if (res.success) {
        alert('রচনাটি অপ্রকাশিত করা হয়েছে।');
        setShowUnpublishModal(false);
        setUnpublishReason('');
        setContent((prev: any) => ({ ...prev, is_published: false }));
      }
    } catch (error: any) {
      console.error('Error unpublishing content:', error);
      alert(error?.message || 'অপ্রকাশিত করতে সমস্যা হয়েছে।');
    } finally {
      setIsUnpublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
        onPurchase={handlePurchase}
        userBalance={user?.kori_balance || 0}
      />
    );
  }

  if (!content) {
    return null;
  }

  const displayAuthor = authorProfile || content.author;
  const authorName = displayAuthor?.full_name || displayAuthor?.username;
  const authorStats = displayAuthor?.stats || {};
  const authorContentCount = authorStats.contentCount || 0;
  const authorFollowerCount = authorStats.followerCount || authorStats.followersCount || 0;

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
              {user?.is_admin && content.status === 'approved' && content.is_published !== false && (
                <button
                  onClick={() => setShowUnpublishModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium bengali-text mr-1 shadow-sm"
                  title="অপ্রকাশিত করুন"
                >
                  <EyeOff className="w-4 h-4" />
                  <span>অপ্রকাশিত করুন</span>
                </button>
              )}
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
                onClick={handleBookmark}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--reader-secondary-text)' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--reader-hover)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="বুকমার্ক"
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current text-blue-600' : ''}`} />
              </button>
              <button
                onClick={handleLike}
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

        {/* Audiobook Player */}
        {content.audio_url && (
          <AudioPlayer src={content.audio_url} title={content.title} />
        )}

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

        <TippingWidget 
          authorId={content.author.id} 
          authorName={content.author.full_name || content.author.username}
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
              src={displayAuthor?.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'Author')}&background=4F46E5&color=fff&size=80`}
              alt={authorName || 'Author'}
              className="w-16 h-16 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <Link 
                  href={`/profile/${displayAuthor?.username}`}
                  className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {authorName}
                </Link>
                <button 
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } ${isFollowLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                  <span>{isFollowing ? 'অনুসরণ করা হচ্ছে' : 'অনুসরণ করুন'}</span>
                </button>
              </div>
              {displayAuthor?.bio && (
                <p className="text-gray-600 mb-3">{displayAuthor.bio}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-500">
                <span>{authorContentCount} রচনা</span>
                <span>{authorFollowerCount} অনুসারী</span>
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

      {/* Admin Unpublish Modal */}
      {showUnpublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-gray-900">
            <div className="flex items-center gap-3 mb-4">
              <EyeOff className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold bengali-text">রচনা অপ্রকাশিত করুন</h3>
            </div>
            <p className="text-gray-600 mb-2 bengali-text">
              &quot;{content.title}&quot; অপ্রকাশিত করতে চান?
            </p>
            <p className="text-sm text-gray-500 mb-4 bengali-text">
              এই রচনাটি সবার কাছ থেকে লুকানো হবে। শুধুমাত্র অ্যাডমিন ইতিহাস থেকে পুনরায় প্রকাশ করা যাবে।
            </p>
            <textarea
              value={unpublishReason}
              onChange={(e) => setUnpublishReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 bengali-text text-gray-900"
              rows={3}
              placeholder="অপ্রকাশিত করার কারণ (ঐচ্ছিক)"
            />
            <div className="flex gap-3">
              <button
                onClick={handleUnpublishSubmit}
                disabled={isUnpublishing}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 bengali-text"
              >
                {isUnpublishing ? 'প্রক্রিয়াকরণ...' : 'অপ্রকাশিত করুন'}
              </button>
              <button
                onClick={() => {
                  setShowUnpublishModal(false);
                  setUnpublishReason('');
                }}
                disabled={isUnpublishing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 bengali-text"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
