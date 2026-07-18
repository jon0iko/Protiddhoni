'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  BookOpen, 
  Edit, 
  Plus, 
  Eye, 
  MoreVertical,
  Trash2,
  Loader2,
  Search
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  content_type: string;
  status: string;
  updated_at: string;
  body: string;
  view_count: number;
  cover_image_url?: string;
  excerpt: string;
  series_id?: string;
  chapter_number?: number;
}

const contentTypeNames: Record<string, string> = {
  'story': 'ছোটগল্প',
  'poem': 'কবিতা',
  'chapter': 'অধ্যায়'
};

const statusNames: Record<string, string> = {
  'draft': 'খসড়া',
  'pending': 'অপেক্ষমান',
  'approved': 'অনুমোদিত',
  'rejected': 'প্রত্যাখ্যাত',
  'published': 'প্রকাশিত'
};

const statusColors: Record<string, string> = {
  'draft': 'bg-yellow-100 text-yellow-800',
  'pending': 'bg-primary-100 text-primary-800',
  'approved': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'published': 'bg-green-100 text-green-800'
};

export default function ContinueWritingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchUserContent = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.content.getByAuthor(user.id, {});
      if (response) {
        // Handle both direct array and wrapped response
        const contentArray = Array.isArray(response) ? response : (response.data || []);
        setStories(contentArray);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchUserContent();
  }, [user, router, fetchUserContent]);

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (story.excerpt && story.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
    const matchesType = typeFilter === 'all' || story.content_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleEditStory = (storyId: string) => {
    router.push(`/write/editor?id=${storyId}`);
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই গল্পটি মুছে ফেলতে চান?')) {
      return;
    }

    try {
      await api.content.delete(storyId);
      setStories(stories.filter(s => s.id !== storyId));
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('গল্প মুছতে সমস্যা হয়েছে!');
    }
  };

  const formatDate = (dateString: string) => {
    // Ensure UTC timestamps are parsed correctly
    const date = /Z|[+-]\d{2}:\d{2}$/.test(dateString) ? new Date(dateString) : new Date(dateString + 'Z');
    return date.toLocaleDateString('bn-BD');
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 bengali-text">
            গল্প চালিয়ে যান
          </h1>
          <p className="text-lg text-gray-600 bengali-text">
            আপনার পূর্বের লেখাগুলি সম্পাদনা করুন বা নতুন অধ্যায় যোগ করুন
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="গল্প খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
            >
              <option value="all">সব অবস্থা</option>
              <option value="draft">খসড়া</option>
              <option value="pending">অপেক্ষমান</option>
              <option value="approved">অনুমোদিত</option>
              <option value="published">প্রকাশিত</option>
              <option value="rejected">প্রত্যাখ্যাত</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
            >
              <option value="all">সব ধরন</option>
              <option value="story">গল্প</option>
              <option value="poem">কবিতা</option>
              <option value="chapter">অধ্যায়</option>
            </select>
          </div>
        </div>

        {/* Stories Grid */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 bengali-text">
              কোনো গল্প পাওয়া যায়নি
            </h3>
            <p className="text-gray-600 mb-6 bengali-text">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'আপনার অনুসন্ধানের সাথে কোনো গল্প মিলেনি।'
                : 'আপনার এখনো কোনো গল্প নেই। নতুন একটি গল্প লিখুন!'
              }
            </p>
            <button
              onClick={() => router.push('/write/editor')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors bengali-text"
            >
              নতুন গল্প লিখুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div key={story.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Cover Image or Placeholder */}
                <div className="h-32 bg-gradient-to-br from-primary-100 to-accent-100 relative">
                  {story.cover_image_url ? (
                    <Image 
                      src={story.cover_image_url} 
                      alt={story.title} 
                      fill
                      className="object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[story.status]} bengali-text`}>
                      {statusNames[story.status]}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button className="p-1 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 bengali-text">
                      {story.title}
                    </h3>
                    <span className="text-xs text-gray-500 bengali-text ml-2">
                      {contentTypeNames[story.content_type] || story.content_type}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 bengali-text">
                    {story.excerpt || 'বিবরণ নেই'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="bengali-text">{countWords(story.body)} শব্দ</span>
                    {story.series_id && story.chapter_number && (
                      <span className="bengali-text">অধ্যায় {story.chapter_number}</span>
                    )}
                    {story.status === 'published' && (
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {story.view_count}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mb-4 bengali-text">
                    শেষ সম্পাদনা: {formatDate(story.updated_at)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditStory(story.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors bengali-text"
                    >
                      <Edit className="w-4 h-4" />
                      <span>সম্পাদনা</span>
                    </button>
                    <button
                      onClick={() => handleDeleteStory(story.id)}
                      className="flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 bengali-text">
            দ্রুত অ্যাকশন
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/write/editor')}
              className="flex items-center space-x-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors text-left"
            >
              <Plus className="w-5 h-5 text-primary-600" />
              <div>
                <div className="font-medium text-primary-900 bengali-text">নতুন গল্প শুরু করুন</div>
                <div className="text-sm text-primary-600 bengali-text">একটি নতুন গল্প লিখতে শুরু করুন</div>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/drafts')}
              className="flex items-center space-x-3 p-4 bg-accent-50 hover:bg-accent-100 rounded-lg transition-colors text-left"
            >
              <BookOpen className="w-5 h-5 text-accent-600" />
              <div>
                <div className="font-medium text-accent-900 bengali-text">সব খসড়া দেখুন</div>
                <div className="text-sm text-accent-600 bengali-text">অসম্পূর্ণ লেখাগুলি দেখুন</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}