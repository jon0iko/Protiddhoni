/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
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

const colorMap: Record<string, any> = {
  'romance': { color: 'from-accent-500 to-accent-600', bgColor: 'bg-accent-50', borderColor: 'border-accent-200', textColor: 'text-accent-700' },
  'horror': { color: 'from-olive-600 to-olive-700', bgColor: 'bg-olive-50', borderColor: 'border-olive-200', textColor: 'text-olive-700' },
  'mystery': { color: 'from-neutral-600 to-neutral-700', bgColor: 'bg-neutral-50', borderColor: 'border-neutral-200', textColor: 'text-neutral-700' },
  'poetry': { color: 'from-primary-400 to-primary-500', bgColor: 'bg-primary-50', borderColor: 'border-primary-200', textColor: 'text-primary-700' },
  'social': { color: 'from-primary-600 to-primary-700', bgColor: 'bg-primary-50', borderColor: 'border-primary-200', textColor: 'text-primary-700' },
  'comedy': { color: 'from-primary-500 to-accent-500', bgColor: 'bg-primary-50', borderColor: 'border-primary-200', textColor: 'text-primary-700' },
  'children': { color: 'from-primary-400 to-primary-600', bgColor: 'bg-primary-50', borderColor: 'border-primary-200', textColor: 'text-primary-700' },
  'historical': { color: 'from-olive-500 to-olive-600', bgColor: 'bg-olive-50', borderColor: 'border-olive-200', textColor: 'text-olive-700' },
  'sci-fi': { color: 'from-accent-600 to-olive-600', bgColor: 'bg-accent-50', borderColor: 'border-accent-200', textColor: 'text-accent-700' },
  'default': { color: 'from-primary-500 to-primary-600', bgColor: 'bg-primary-50', borderColor: 'border-primary-200', textColor: 'text-primary-700' }
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.getAll(true);
        const categoriesData = (response.data || []).map((cat: any) => {
          const colors = colorMap[cat.slug] || colorMap['default'];
          return {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            ...colors,
            storyCount: cat.contentCount || 0,
            totalReads: cat.contentCount ? `${(cat.contentCount * 1.5).toFixed(1)}K` : '0',
            trending: cat.contentCount > 10,
            featured: cat.contentCount > 15,
            coverImage: cat.cover_image || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
            topAuthors: [],
            tags: []
          };
        });
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600 bengali-text">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 via-accent-600 to-olive-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            
            <p className="text-xl text-primary-100 max-w-3xl mx-auto leading-relaxed bengali-text">
              আপনার পছন্দের ধরনের গল্প খুঁজে নিন। প্রেম থেকে রহস্য, অনুপ্রেরণা থেকে অ্যাডভেঞ্চার - 
              সব ধরনের গল্পের সমাহার এখানে।
            </p>
            <div className="mt-8 flex items-center justify-center space-x-8 text-primary-100">
              <div className="text-center">
                <div className="text-2xl font-bold">{categories.length.toLocaleString()}+</div>
                <div className="text-sm bengali-text">বিভাগ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {categories.reduce((sum, cat) => sum + cat.storyCount, 0).toLocaleString()}+
                </div>
                <div className="text-sm bengali-text">গল্প</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">১০০০+</div>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
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
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 bengali-text">
                  শুধু ট্রেন্ডিং
                </span>
              </label>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
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
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        

        {/* All Categories */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 bengali-text">
              {showTrendingOnly ? 'ট্রেন্ডিং বিভাগ' : 'সব বিভাগ'}
            </h2>
            <span className="text-gray-500 bengali-text">
              {sortedCategories.length.toLocaleString()}টি বিভাগ পাওয়া গেছে
            </span>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedCategories.map((category) => {
                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className={`group ${category.bgColor} ${category.borderColor} border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div className="text-center">
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${category.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <BookOpen className="h-8 w-8" />
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
                          {category.tags.slice(0, 3).map((tag: any, index: number) => (
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
                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-primary-200"
                  >
                    <div className="flex items-center space-x-6">
                      <div className={`flex-shrink-0 p-4 rounded-xl bg-gradient-to-r ${category.color} text-white group-hover:scale-105 transition-transform duration-300`}>
                        <BookOpen className="h-8 w-8" />
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
                            <span>{category.totalReads.toLocaleString()} পাঠক</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>জনপ্রিয় লেখক: {category.topAuthors.slice(0, 2).join(', ')}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {category.tags.map((tag: any, index: number) => (
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