'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Filter,
  SlidersHorizontal,
  Search,
  Grid,
  List,
  Star,
  Eye,
  Clock,
  BookOpen,
  TrendingUp,
  Heart,
  Users,
  Calendar,
  Tag,
  ChevronDown,
  X
} from 'lucide-react';
import ContentCard from '@/components/content/ContentCard';

// Mock data for category and stories
const getCategoryData = (slug: string) => {
  const categories = {
    'romance': {
      id: 'romance',
      name: 'রোমান্স',
      description: 'প্রেম, ভালোবাসা এবং রোমান্টিক গল্পসমূহ',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      coverImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&h=400&fit=crop',
      storyCount: 1247,
      totalReads: '2.3M',
      avgRating: 4.6,
      tags: ['প্রেম', 'ভালোবাসা', 'রোমান্টিক', 'হৃদয়স্পর্শী', 'সম্পর্ক', 'বিয়ে']
    },
    'mystery': {
      id: 'mystery',
      name: 'রহস্য',
      description: 'রহস্যময় এবং রোমাঞ্চকর গল্পের সংগ্রহ',
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50',
      coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=400&fit=crop',
      storyCount: 892,
      totalReads: '1.8M',
      avgRating: 4.7,
      tags: ['রহস্য', 'রোমাঞ্চ', 'গোয়েন্দা', 'সাসপেন্স', 'থ্রিলার', 'ক্রাইম']
    },
    'inspiration': {
      id: 'inspiration',
      name: 'অনুপ্রেরণামূলক',
      description: 'জীবন পরিবর্তনকারী অনুপ্রেরণামূলক কাহিনী',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
      storyCount: 634,
      totalReads: '1.2M',
      avgRating: 4.5,
      tags: ['অনুপ্রেরণা', 'জীবনবোধ', 'আত্মউন্নয়ন', 'সফলতা', 'মোটিভেশন', 'জীবন']
    }
  };

  return categories[slug as keyof typeof categories] || categories.romance;
};

const getStoriesData = (categorySlug: string) => ([
  {
    id: '1',
    title: 'শান্তরী',
    slug: 'shantari',
    author: 'মেঘবর্ণ',
    authorSlug: 'meghoborno',
    excerpt: 'দেশের নামকরা নিউজ চ্যানেলগুলোতে রেগুলার নিউজ হিসেবে একটা খবর বারবার দেখানো হচ্ছে...',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    rating: 4.8,
    totalRatings: 1250,
    views: 15420,
    readTime: '25 মিনিট',
    publishedAt: '2024-01-15',
    updatedAt: '2024-01-20',
    status: 'completed',
    chapters: 6,
    tags: ['প্রেম', 'জীবনবোধ', 'সমাজ'],
    isPremium: false,
    isNew: false,
    isTrending: true,
    language: 'bengali'
  },
  {
    id: '2',
    title: 'অনন্ত প্রেমের গল্প',
    slug: 'anonto-premer-golpo',
    author: 'তানিয়া রহমান',
    authorSlug: 'tania-rahman',
    excerpt: 'একটি সাধারণ মেয়ের অসাধারণ প্রেমের কাহিনী যা আপনার হৃদয় ছুঁয়ে যাবে...',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
    rating: 4.6,
    totalRatings: 890,
    views: 12340,
    readTime: '35 মিনিট',
    publishedAt: '2024-01-10',
    updatedAt: '2024-01-18',
    status: 'ongoing',
    chapters: 8,
    tags: ['রোমান্স', 'প্রেম', 'সম্পর্ক'],
    isPremium: false,
    isNew: true,
    isTrending: false,
    language: 'bengali'
  },
  {
    id: '3',
    title: 'রহস্যময় রাত্রি',
    slug: 'rohossomoy-ratri',
    author: 'আকাশ চৌধুরী',
    authorSlug: 'akash-chowdhury',
    excerpt: 'একটি রাতের রহস্যময় ঘটনা যা পুরো শহরকে কাঁপিয়ে দিয়েছিল...',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
    rating: 4.9,
    totalRatings: 2100,
    views: 18750,
    readTime: '40 মিনিট',
    publishedAt: '2024-01-05',
    updatedAt: '2024-01-22',
    status: 'completed',
    chapters: 10,
    tags: ['রহস্য', 'রোমাঞ্চ', 'সাসপেন্স'],
    isPremium: true,
    isNew: false,
    isTrending: true,
    language: 'bengali'
  },
  {
    id: '4',
    title: 'প্রথম ভালোবাসা',
    slug: 'prothom-bhalobasha',
    author: 'সারা খান',
    authorSlug: 'sara-khan',
    excerpt: 'স্কুলের প্রথম প্রেমের মধুর স্মৃতি এবং তার পরিণতির গল্প...',
    coverImage: 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=300&h=400&fit=crop',
    rating: 4.4,
    totalRatings: 670,
    views: 9830,
    readTime: '20 মিনিট',
    publishedAt: '2024-01-12',
    updatedAt: '2024-01-19',
    status: 'completed',
    chapters: 4,
    tags: ['প্রেম', 'যুব', 'স্কুল'],
    isPremium: false,
    isNew: true,
    isTrending: false,
    language: 'bengali'
  }
]);

export default function CategoryPage() {
  const params = useParams();
  const [category, setCategory] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [filteredStories, setFilteredStories] = useState<any[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [premiumFilter, setPremiumFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    const categoryData = getCategoryData(params.slug as string);
    const storiesData = getStoriesData(params.slug as string);
    
    setCategory(categoryData);
    setStories(storiesData);
    setFilteredStories(storiesData);
  }, [params.slug]);

  useEffect(() => {
    let filtered = stories.filter(story => story != null);

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(story =>
        story && (
          (story.title && story.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (story.author && story.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (story.excerpt && story.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(story =>
        story && story.tags && selectedTags.some(tag => story.tags.includes(tag))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(story => story && story.status === statusFilter);
    }

    // Rating filter
    if (ratingFilter > 0) {
      filtered = filtered.filter(story => story && typeof story.rating === 'number' && story.rating >= ratingFilter);
    }

    // Premium filter
    if (premiumFilter !== 'all') {
      filtered = filtered.filter(story => 
        story && (premiumFilter === 'premium' ? story.isPremium : !story.isPremium)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      if (dateFilter !== 'all') {
        filtered = filtered.filter(story => 
          story && story.publishedAt && new Date(story.publishedAt) >= filterDate
        );
      }
    }

    // Sort
    filtered.sort((a, b) => {
      if (!a || !b) return 0;
      
      switch (sortBy) {
        case 'newest':
          return a.publishedAt && b.publishedAt 
            ? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            : 0;
        case 'oldest':
          return a.publishedAt && b.publishedAt 
            ? new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
            : 0;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'title':
          return a.title && b.title ? a.title.localeCompare(b.title) : 0;
        default: // popular
          return (b.views || 0) - (a.views || 0);
      }
    });

    setFilteredStories(filtered);
  }, [stories, searchQuery, selectedTags, statusFilter, ratingFilter, premiumFilter, dateFilter, sortBy]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setStatusFilter('all');
    setRatingFilter(0);
    setPremiumFilter('all');
    setDateFilter('all');
  };

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Hero */}
      <div className="relative">
        <div className="aspect-[3/1] relative overflow-hidden">
          <img
            src={category.coverImage}
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-80`}></div>
        </div>
        
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-white">
              <Link
                href="/categories"
                className="inline-flex items-center space-x-2 text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="bengali-text">বিভাগসমূহ</span>
              </Link>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bengali-text">
                {category.name}
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mb-6 bengali-text">
                {category.description}
              </p>
              
              <div className="flex items-center space-x-8 text-white/90">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span className="bengali-text">{category.storyCount.toLocaleString()} গল্প</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>{category.totalReads} পাঠক</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span>{category.avgRating} গড় রেটিং</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          {/* Main Controls Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="গল্প বা লেখক খুঁজুন..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  showFilters
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="bengali-text">ফিল্টার</span>
              </button>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
              >
                <option value="popular">জনপ্রিয়</option>
                <option value="newest">নতুন</option>
                <option value="oldest">পুরাতন</option>
                <option value="rating">রেটিং</option>
                <option value="views">ভিউ</option>
                <option value="title">নাম</option>
              </select>

              {/* View Mode */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t border-gray-200 pt-4 space-y-4">
              {/* Filter Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    অবস্থা
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                  >
                    <option value="all">সব</option>
                    <option value="completed">সম্পূর্ণ</option>
                    <option value="ongoing">চলমান</option>
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    রেটিং
                  </label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                  >
                    <option value={0}>সব রেটিং</option>
                    <option value={4.5}>৪.৫+ স্টার</option>
                    <option value={4}>৪+ স্টার</option>
                    <option value={3.5}>৩.৫+ স্টার</option>
                    <option value={3}>৩+ স্টার</option>
                  </select>
                </div>

                {/* Premium */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    টাইপ
                  </label>
                  <select
                    value={premiumFilter}
                    onChange={(e) => setPremiumFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                  >
                    <option value="all">সব</option>
                    <option value="free">ফ্রি</option>
                    <option value="premium">প্রিমিয়াম</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    প্রকাশকাল
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                  >
                    <option value="all">সব সময়</option>
                    <option value="week">গত সপ্তাহ</option>
                    <option value="month">গত মাস</option>
                    <option value="year">গত বছর</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                  ট্যাগ
                </label>
                <div className="flex flex-wrap gap-2">
                  {category.tags.map((tag: string) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors bengali-text ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Filters & Clear */}
              {(selectedTags.length > 0 || statusFilter !== 'all' || ratingFilter > 0 || premiumFilter !== 'all' || dateFilter !== 'all') && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 bengali-text">সক্রিয় ফিল্টার:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedTags.map(tag => (
                        <span key={tag} className="inline-flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                          <span className="bengali-text">#{tag}</span>
                          <X className="h-3 w-3 cursor-pointer" onClick={() => handleTagToggle(tag)} />
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium bengali-text"
                  >
                    সব ক্লিয়ার করুন
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 bengali-text">
            {filteredStories.length}টি গল্প পাওয়া গেছে
          </h2>
          {searchQuery && (
            <span className="text-gray-600 bengali-text">
              "{searchQuery}" এর জন্য ফলাফল
            </span>
          )}
        </div>

        {/* Stories Grid/List */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 bengali-text">
              কোনো গল্প পাওয়া যায়নি
            </h3>
            <p className="text-gray-600 bengali-text">
              {searchQuery || selectedTags.length > 0 
                ? 'আপনার অনুসন্ধানের সাথে কোনো গল্প মিলেনি। ফিল্টার পরিবর্তন করে দেখুন।'
                : 'এই বিভাগে এখনো কোনো গল্প নেই।'
              }
            </p>
            {(searchQuery || selectedTags.length > 0) && (
              <button
                onClick={clearFilters}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors bengali-text"
              >
                সব ফিল্টার ক্লিয়ার করুন
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStories.filter(story => story != null).map((story) => (
              <ContentCard 
                key={story.id} 
                story={{
                  ...story,
                  category: category?.name
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredStories.filter(story => story != null).map((story) => (
              <div key={story.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex space-x-4">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-24 h-32 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Link
                          href={`/story/${story.slug}`}
                          className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors bengali-text"
                        >
                          {story.title}
                        </Link>
                        <p className="text-gray-600 bengali-text">লেখক: {story.author}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {story.isPremium && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                            প্রিমিয়াম
                          </span>
                        )}
                        {story.isTrending && (
                          <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>ট্রেন্ডিং</span>
                          </span>
                        )}
                        {story.isNew && (
                          <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                            নতুন
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3 bengali-text line-clamp-2">
                      {story.excerpt}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{story.rating}</span>
                        <span>({story.totalRatings})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{story.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span className="bengali-text">{story.chapters} অধ্যায়</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span className="bengali-text">{story.readTime}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {story.tags.slice(0, 3).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs bengali-text"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/story/${story.slug}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors bengali-text"
                      >
                        পড়ুন
                      </Link>
                    </div>
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
