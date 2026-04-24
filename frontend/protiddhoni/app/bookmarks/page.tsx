'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import ContentCard from '@/components/content/ContentCard';

export default function BookmarksPage() {
  const { isLoggedIn, isLoading, user } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/bookmarks');
    } else if (isLoggedIn) {
      loadBookmarks();
    }
  }, [isLoggedIn, isLoading]);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await api.bookmarks.getMyBookmarks();
      if (response.success) {
        setBookmarks(response.data || []);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (contentId: string) => {
    if (!confirm('এই বুকমার্কটি মুছে ফেলতে চান?')) return;

    setDeleting(contentId);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await api.bookmarks.removeBookmark(contentId);
      setBookmarks(bookmarks.filter(b => b.content_id !== contentId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      alert('বুকমার্ক মুছতে সমস্যা হয়েছে।');
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2 bengali-text">
            বুকমার্ক দেখতে লগইন করুন
          </h1>
          <p className="text-gray-600 mb-6 bengali-text">
            আপনার পছন্দের গল্পগুলো সংরক্ষণ করুন এবং পরে পড়ুন
          </p>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors bengali-text"
          >
            লগইন করুন
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">বুকমার্ক</h1>
          <p className="text-gray-600">{bookmarks.length}টি সংরক্ষিত রচনা</p>
        </div>

        {/* Bookmarks Grid */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">কোনো বুকমার্ক নেই</h3>
            <p className="text-gray-500 mb-6">
              আপনার পছন্দের রচনা বুকমার্ক করুন এবং সহজে খুঁজে পান
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              রচনা খুঁজুন
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="relative">
                {bookmark.content && <ContentCard content={bookmark.content} />}
                <button
                  onClick={() => handleRemoveBookmark(bookmark.content_id)}
                  disabled={deleting === bookmark.content_id}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
                  title="বুকমার্ক মুছুন"
                >
                  {deleting === bookmark.content_id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}