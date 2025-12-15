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

      const response = await api.bookmarks.getMyBookmarks(token);
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

      await api.bookmarks.removeBookmark(contentId, token);
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
                <ContentCard content={bookmark.content} />
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
          </div>
        )}
      </div>
    </div>
  );
}

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bookmark.story.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'reading') return matchesSearch && bookmark.chapter.progress < 100;
    if (filterBy === 'completed') return matchesSearch && bookmark.chapter.progress === 100;
    
    return matchesSearch;
  });

  const handleSelectBookmark = (bookmarkId: string) => {
    setSelectedBookmarks(prev => 
      prev.includes(bookmarkId) 
        ? prev.filter(id => id !== bookmarkId)
        : [...prev, bookmarkId]
    );
  };

  const handleDeleteSelected = () => {
    setBookmarks(prev => prev.filter(bookmark => !selectedBookmarks.includes(bookmark.id)));
    setSelectedBookmarks([]);
  };

  const handleRemoveBookmark = (bookmarkId: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Bookmark className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 bengali-text">
              আমার বুকমার্ক
            </h1>
          </div>
          <p className="text-gray-600 bengali-text">
            আপনার সংরক্ষিত গল্প এবং অধ্যায়গুলো এখানে পাবেন
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="গল্প বা লেখক খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
              >
                <option value="all">সব</option>
                <option value="reading">পড়া হচ্ছে</option>
                <option value="completed">সম্পন্ন</option>
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
            >
              <option value="recent">সাম্প্রতিক</option>
              <option value="title">নাম অনুসারে</option>
              <option value="author">লেখক অনুসারে</option>
              <option value="rating">রেটিং অনুসারে</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedBookmarks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 bengali-text">
                  {selectedBookmarks.length}টি নির্বাচিত
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="bengali-text">মুছে ফেলুন</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bookmarks Grid */}
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 bengali-text">
              কোনো বুকমার্ক পাওয়া যায়নি
            </h3>
            <p className="text-gray-600 bengali-text">
              {searchQuery ? 'আপনার অনুসন্ধানের সাথে কোনো বুকমার্ক মিলেনি' : 'আপনার কোনো বুকমার্ক নেই'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Selection Checkbox */}
                <div className="p-3 border-b border-gray-100">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBookmarks.includes(bookmark.id)}
                      onChange={() => handleSelectBookmark(bookmark.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 bengali-text">নির্বাচন করুন</span>
                  </label>
                </div>

                <div className="p-4">
                  {/* Story Info */}
                  <div className="flex space-x-4 mb-4">
                    <img
                      src={bookmark.story.coverImage}
                      alt={bookmark.story.title}
                      className="w-16 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 bengali-text line-clamp-2">
                        {bookmark.story.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 bengali-text">
                        {bookmark.story.author}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded bengali-text">
                          {bookmark.story.category}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500" fill="currentColor" />
                          <span>{bookmark.story.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chapter Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 bengali-text">
                        {bookmark.chapter.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        {bookmark.chapter.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${bookmark.chapter.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="bengali-text">বুকমার্ক: {bookmark.bookmarkedAt}</span>
                    <span className="bengali-text">পড়া: {bookmark.lastRead}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/story/${bookmark.story.id}/chapter/${bookmark.chapter.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center bengali-text"
                    >
                      পড়া চালিয়ে যান
                    </Link>
                    <Link
                      href={`/story/${bookmark.story.id}`}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <BookOpen className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleRemoveBookmark(bookmark.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}