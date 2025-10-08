'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Edit, 
  Plus, 
  Calendar, 
  Eye, 
  Star, 
  ChevronRight,
  Filter,
  Search,
  MoreVertical,
  Trash2
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  type: 'short-story' | 'novel' | 'poetry' | 'article';
  status: 'draft' | 'published' | 'private';
  lastModified: string;
  wordCount: number;
  chapters: number;
  views: number;
  likes: number;
  coverImage?: string;
  excerpt: string;
}

// Mock data - in real app, this would come from your backend
const userStories: Story[] = [
  {
    id: '1',
    title: 'সূর্যাস্তের গল্প',
    type: 'short-story',
    status: 'published',
    lastModified: '2024-01-15',
    wordCount: 1250,
    chapters: 1,
    views: 342,
    likes: 28,
    excerpt: 'একটি সুন্দর সন্ধ্যার গল্প যেখানে প্রকৃতির সাথে মানুষের আবেগের মিলন ঘটেছে...'
  },
  {
    id: '2',
    title: 'হারিয়ে যাওয়া দিনগুলি',
    type: 'novel',
    status: 'draft',
    lastModified: '2024-01-12',
    wordCount: 5420,
    chapters: 3,
    views: 0,
    likes: 0,
    excerpt: 'একটি অসমাপ্ত উপন্যাস যা শৈশবের স্মৃতি নিয়ে লেখা...'
  },
  {
    id: '3',
    title: 'বৃষ্টির কবিতা',
    type: 'poetry',
    status: 'published',
    lastModified: '2024-01-10',
    wordCount: 145,
    chapters: 1,
    views: 89,
    likes: 12,
    excerpt: 'মেঘের গর্জন আর বৃষ্টির ছন্দে লেখা একটি মধুর কবিতা...'
  }
];

const storyTypeNames = {
  'short-story': 'ছোটগল্প',
  'novel': 'উপন্যাস',
  'poetry': 'কবিতা',
  'article': 'প্রবন্ধ'
};

const statusNames = {
  'draft': 'খসড়া',
  'published': 'প্রকাশিত',
  'private': 'ব্যক্তিগত'
};

const statusColors = {
  'draft': 'bg-yellow-100 text-yellow-800',
  'published': 'bg-green-100 text-green-800',
  'private': 'bg-gray-100 text-gray-800'
};

export default function ContinueWritingPage() {
  const router = useRouter();
  const [stories, setStories] = useState(userStories);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
    const matchesType = typeFilter === 'all' || story.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleEditStory = (storyId: string) => {
    router.push(`/write/editor?id=${storyId}`);
  };

  const handleAddChapter = (storyId: string) => {
    router.push(`/write/editor?id=${storyId}&new-chapter=true`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD');
  };

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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
            >
              <option value="all">সব অবস্থা</option>
              <option value="draft">খসড়া</option>
              <option value="published">প্রকাশিত</option>
              <option value="private">ব্যক্তিগত</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
            >
              <option value="all">সব ধরন</option>
              <option value="short-story">ছোটগল্প</option>
              <option value="novel">উপন্যাস</option>
              <option value="poetry">কবিতা</option>
              <option value="article">প্রবন্ধ</option>
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
              onClick={() => router.push('/write/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors bengali-text"
            >
              নতুন গল্প লিখুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div key={story.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Cover Image or Placeholder */}
                <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 relative">
                  {story.coverImage ? (
                    <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
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
                      {storyTypeNames[story.type]}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 bengali-text">
                    {story.excerpt}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="bengali-text">{story.wordCount} শব্দ</span>
                    {story.chapters > 1 && (
                      <span className="bengali-text">{story.chapters} অধ্যায়</span>
                    )}
                    {story.status === 'published' && (
                      <>
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {story.views}
                        </span>
                        <span className="flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          {story.likes}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mb-4 bengali-text">
                    শেষ সম্পাদনা: {formatDate(story.lastModified)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditStory(story.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors bengali-text"
                    >
                      <Edit className="w-4 h-4" />
                      <span>সম্পাদনা</span>
                    </button>
                    {story.type === 'novel' && (
                      <button
                        onClick={() => handleAddChapter(story.id)}
                        className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors bengali-text"
                      >
                        <Plus className="w-4 h-4" />
                        <span>অধ্যায়</span>
                      </button>
                    )}
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
              onClick={() => router.push('/write/new')}
              className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900 bengali-text">নতুন গল্প শুরু করুন</div>
                <div className="text-sm text-blue-600 bengali-text">একটি নতুন গল্প লিখতে শুরু করুন</div>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/drafts')}
              className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
            >
              <BookOpen className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-purple-900 bengali-text">সব খসড়া দেখুন</div>
                <div className="text-sm text-purple-600 bengali-text">অসম্পূর্ণ লেখাগুলি দেখুন</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}