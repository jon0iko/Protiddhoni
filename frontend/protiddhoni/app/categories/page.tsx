'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Heart, 
  Zap, 
  Crown, 
  Sword, 
  Coffee, 
  Star,
  Users,
  TrendingUp,
  Eye,
  Search,
  Grid,
  List,
  Filter
} from 'lucide-react';

// Mock data for categories
const categories = [
  {
    id: 'romance',
    name: 'রোমান্স',
    slug: 'romance',
    description: 'প্রেম, ভালোবাসা এবং রোমান্টিক গল্পসমূহ',
    icon: Heart,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    storyCount: 1247,
    totalReads: '2.3M',
    trending: true,
    featured: true,
    coverImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=300&fit=crop',
    topAuthors: ['তানিয়া রহমান', 'সাদিয়া খান', 'রিফাত আহমেদ'],
    tags: ['প্রেম', 'ভালোবাসা', 'রোমান্টিক', 'হৃদয়স্পর্শী']
  },
  {
    id: 'mystery',
    name: 'রহস্য',
    slug: 'mystery',
    description: 'রহস্যময় এবং রোমাঞ্চকর গল্পের সংগ্রহ',
    icon: Zap,
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    storyCount: 892,
    totalReads: '1.8M',
    trending: true,
    featured: false,
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    topAuthors: ['আকাশ চৌধুরী', 'নিলয় দাস', 'সুমি আক্তার'],
    tags: ['রহস্য', 'রোমাঞ্চ', 'গোয়েন্দা', 'সাসপেন্স']
  },
  {
    id: 'inspiration',
    name: 'অনুপ্রেরণামূলক',
    slug: 'inspiration',
    description: 'জীবন পরিবর্তনকারী অনুপ্রেরণামূলক কাহিনী',
    icon: Star,
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    storyCount: 634,
    totalReads: '1.2M',
    trending: false,
    featured: true,
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    topAuthors: ['মেঘবর্ণ', 'রূপক সেন', 'অনিতা দেবী'],
    tags: ['অনুপ্রেরণা', 'জীবনবোধ', 'আত্মউন্নয়ন', 'সফলতা']
  },
  {
    id: 'adventure',
    name: 'অ্যাডভেঞ্চার',
    slug: 'adventure',
    description: 'রোমাঞ্চকর অভিযান এবং সাহসিকতার গল্প',
    icon: Sword,
    color: 'from-green-500 to-teal-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    storyCount: 456,
    totalReads: '890K',
    trending: false,
    featured: false,
    coverImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    topAuthors: ['রাহুল হাসান', 'সাবিনা খাতুন', 'জাহিদ করিম'],
    tags: ['অভিযান', 'সাহসিকতা', 'ভ্রমণ', 'রোমাঞ্চ']
  },
  {
    id: 'drama',
    name: 'নাটক',
    slug: 'drama',
    description: 'জীবনের নানা চরাইত্র ও পরিস্থিতির নাটকীয় উপস্থাপনা',
    icon: Crown,
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    storyCount: 723,
    totalReads: '1.5M',
    trending: true,
    featured: false,
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    topAuthors: ['নাসির উদ্দিন', 'ফাতেমা বেগম', 'আলমগীর হোসেন'],
    tags: ['নাটক', 'চরিত্র', 'সমাজ', 'মানবিক']
  },
  {
    id: 'slice-of-life',
    name: 'জীবনযাত্রা',
    slug: 'slice-of-life',
    description: 'দৈনন্দিন জীবনের সাধারণ কিন্তু অর্থবহ মুহূর্তসমূহ',
    icon: Coffee,
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    storyCount: 589,
    totalReads: '1.1M',
    trending: false,
    featured: true,
    coverImage: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=300&fit=crop',
    topAuthors: ['শাহীন আখতার', 'মাহবুব রহমান', 'নাদিয়া সুলতানা'],
    tags: ['জীবন', 'দৈনন্দিন', 'পরিবার', 'সম্পর্ক']
  }
];

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrending = !showTrendingOnly || category.trending;
    
    return matchesSearch && matchesTrending;
  });

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'stories':
        return b.storyCount - a.storyCount;
      case 'reads':
        return b.totalReads.localeCompare(a.totalReads);
      default: // popular
        return b.storyCount - a.storyCount;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <BookOpen className="h-16 w-16 text-white/90 mr-4" />
              <h1 className="text-5xl font-bold bengali-text">গল্পের বিভাগসমূহ</h1>
            </div>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed bengali-text">
              আপনার পছন্দের ধরনের গল্প খুঁজে নিন। প্রেম থেকে রহস্য, অনুপ্রেরণা থেকে অ্যাডভেঞ্চার - 
              সব ধরনের গল্পের সমাহার এখানে।
            </p>
            <div className="mt-8 flex items-center justify-center space-x-8 text-blue-100">
              <div className="text-center">
                <div className="text-2xl font-bold">{categories.length}+</div>
                <div className="text-sm bengali-text">বিভাগ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {categories.reduce((sum, cat) => sum + cat.storyCount, 0).toLocaleString()}+
                </div>
                <div className="text-sm bengali-text">গল্প</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">10M+</div>
                <div className="text-sm bengali-text">পাঠক</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="বিভাগ খুঁজুন..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Trending Filter */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTrendingOnly}
                  onChange={(e) => setShowTrendingOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 bengali-text">
                  শুধু ট্রেন্ডিং
                </span>
              </label>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
              >
                <option value="popular">জনপ্রিয়তা</option>
                <option value="name">নাম</option>
                <option value="stories">গল্পের সংখ্যা</option>
                <option value="reads">পাঠকসংখ্যা</option>
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
        </div>

        {/* Featured Categories */}
        {!searchQuery && !showTrendingOnly && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 bengali-text">ফিচার্ড বিভাগ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.filter(cat => cat.featured).map((category) => {
                const IconComponent = category.icon;
                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="aspect-[4/3] relative">
                      <img
                        src={category.coverImage}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-80`}></div>
                      <div className="absolute inset-0 flex items-end p-6">
                        <div className="text-white">
                          <div className="flex items-center space-x-3 mb-2">
                            <IconComponent className="h-8 w-8" />
                            <h3 className="text-2xl font-bold bengali-text">{category.name}</h3>
                          </div>
                          <p className="text-white/90 mb-3 bengali-text">{category.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center space-x-1">
                              <BookOpen className="h-4 w-4" />
                              <span>{category.storyCount.toLocaleString()} গল্প</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>{category.totalReads}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      {category.trending && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>ট্রেন্ডিং</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* All Categories */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 bengali-text">
              {showTrendingOnly ? 'ট্রেন্ডিং বিভাগ' : 'সব বিভাগ'}
            </h2>
            <span className="text-gray-500 bengali-text">
              {sortedCategories.length}টি বিভাগ পাওয়া গেছে
            </span>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className={`group ${category.bgColor} ${category.borderColor} border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div className="text-center">
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${category.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <h3 className={`text-xl font-bold ${category.textColor} mb-2 bengali-text`}>
                        {category.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 bengali-text line-clamp-2">
                        {category.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{category.storyCount.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{category.totalReads}</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {category.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="bg-white/70 px-2 py-1 rounded-full text-xs text-gray-600 bengali-text"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      {category.trending && (
                        <div className="mt-3">
                          <span className="inline-flex items-center space-x-1 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                            <TrendingUp className="h-3 w-3" />
                            <span>ট্রেন্ডিং</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-blue-200"
                  >
                    <div className="flex items-center space-x-6">
                      <div className={`flex-shrink-0 p-4 rounded-xl bg-gradient-to-r ${category.color} text-white group-hover:scale-105 transition-transform duration-300`}>
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 bengali-text">
                            {category.name}
                          </h3>
                          {category.trending && (
                            <span className="inline-flex items-center space-x-1 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                              <TrendingUp className="h-3 w-3" />
                              <span>ট্রেন্ডিং</span>
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3 bengali-text">{category.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{category.storyCount.toLocaleString()} গল্প</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{category.totalReads} পাঠক</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>জনপ্রিয় লেখক: {category.topAuthors.slice(0, 2).join(', ')}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {category.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600 bengali-text"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty State */}
        {sortedCategories.length === 0 && (
          <div className="text-center py-12">
            <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 bengali-text">
              কোনো বিভাগ পাওয়া যায়নি
            </h3>
            <p className="text-gray-600 bengali-text">
              আপনার অনুসন্ধানের সাথে কোনো বিভাগ মিলেনি। অন্য কিছু খুঁজে দেখুন।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}