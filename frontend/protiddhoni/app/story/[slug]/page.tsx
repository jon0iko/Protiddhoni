'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, 
  Clock, 
  Eye, 
  BookOpen, 
  Heart, 
  Share2, 
  Download,
  Play,
  Lock,
  Calendar,
  Tag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Mock story data based on slug
const getStoryData = (slug: string) => {
  const stories: { [key: string]: any } = {
    'ontoraler-golpo': {
      id: '1',
      title: 'অন্তরালের গল্প',
      subtitle: 'Bengali Love Story',
      category: 'প্রেমের গল্প',
    },
    'mayer-chithi': {
      id: '2',
      title: 'মায়ের চিঠি',
      subtitle: 'Bengali Emotional Story',
      category: 'সামাজিক',
    },
    'rater-nishobdota': {
      id: '3',
      title: 'রাতের নিঃশব্দতা',
      subtitle: 'Bengali Horror Story',
      category: 'ভৌতিক',
    },
    'boshonter-kobita': {
      id: '4',
      title: 'বসন্তের কবিতা',
      subtitle: 'Bengali Poetry',
      category: 'কবিতা',
    }
  };

  const storyData = stories[slug] || {
    id: '1',
    title: 'শান্তরী',
    subtitle: 'Bengali Love Story',
    category: 'অনুপ্রেরণামূলক',
  };

  return {
    ...storyData,
    author: {
      name: 'মেঘবর্ণ',
      followers: '16K',
      avatar: 'https://ui-avatars.com/api/?name=মেঘবর্ণ&background=4F46E5&color=fff'
    },
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
    description: 'দেশের নামকরা নিউজ চ্যানেলগুলোতে রেগুলার নিউজ হিসেবে একটা খবর বারবার দেখানো হচ্ছে, "বিদেশে মাত্রিত্বে অনুষ্ঠিত আন্তর্জাতিক টুর্নামেন্ট উদঘাটন কালে প্রথমবার অংশগ্রহণ করার সুযোগ পেয়ে দমদম এয়ারপোর্ট ..."',
  rating: 4.9,
  totalRatings: 69000,
  readTime: '22 ঘন্টা',
  views: '895979+',
  publishDate: '29 ডিসেম্বর 2022',
  totalChapters: 6,
  status: 'সম্পূর্ণ',
  tags: ['প্রেম', 'জীবনবোধ', 'সমাজ', 'অনুপ্রেরণা'],
  chapters: [
    {
      id: 1,
      title: 'শান্তরী',
      views: '7K+',
      rating: 4.8,
      readTime: '5 মিনিট',
      publishDate: '29 ডিসেম্বর 2022',
      isLocked: false
    },
    {
      id: 2,
      title: 'শান্তরী ( পর্ব - দুই )',
      views: '4K+',
      rating: 4.9,
      readTime: '6 মিনিট',
      publishDate: '31 ডিসেম্বর 2022',
      isLocked: false
    },
    {
      id: 3,
      title: 'শান্তরী ( পর্ব - তিন )',
      views: '4K+',
      rating: 4.8,
      readTime: '6 মিনিট',
      publishDate: '01 জানুয়ারী 2023',
      isLocked: false
    },
    {
      id: 4,
      title: 'শান্তরী ( পর্ব - চার )',
      views: '3K+',
      rating: 4.7,
      readTime: '5 মিনিট',
      publishDate: '03 জানুয়ারী 2023',
      isLocked: true,
      lockMessage: 'পর্বটি পড়ার জন্য প্রিমিয়াম অ্যাপ ডাউনলোড করুন'
    },
    {
      id: 5,
      title: 'শান্তরী ( পর্ব - পাঁচ )',
      views: '2K+',
      rating: 4.6,
      readTime: '7 মিনিট',
      publishDate: '05 জানুয়ারী 2023',
      isLocked: true,
      lockMessage: 'পর্বটি পড়ার জন্য প্রিমিয়াম অ্যাপ ডাউনলোড করুন'
    },
    {
      id: 6,
      title: 'শান্তরী ( পর্ব - ছয় )',
      views: '1K+',
      rating: 4.5,
      readTime: '8 মিনিট',
      publishDate: '07 জানুয়ারী 2023',
      isLocked: true,
      lockMessage: 'পর্বটি পড়ার জন্য প্রিমিয়াম অ্যাপ ডাউনলোড করুন'
    }
  ]
  };
};

export default function StoryOverviewPage() {
  const params = useParams();
  const { isLoggedIn } = useAuth();
  const [story, setStory] = useState<any>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const storyData = getStoryData(params.slug as string);
    setStory(storyData);
  }, [params.slug]);

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: story.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('লিংক কপি করা হয়েছে!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Story Cover */}
            <div className="lg:col-span-1">
              <div className="relative">
                <img
                  src={story.coverImage}
                  alt={story.title}
                  className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl"
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {story.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Story Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Category */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="h-4 w-4 text-blue-200" />
                  <span className="text-blue-100 text-sm">{story.category}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 bengali-text">
                  {story.title}
                </h1>
                <p className="text-xl text-blue-100 bengali-text">{story.subtitle}</p>
              </div>

              {/* Author Info */}
              <div className="flex items-center space-x-4">
                <img
                  src={story.author.avatar}
                  alt={story.author.name}
                  className="w-12 h-12 rounded-full border-2 border-white/20"
                />
                <div>
                  <h3 className="font-semibold bengali-text">{story.author.name}</h3>
                  <p className="text-blue-100 text-sm bengali-text">
                    {story.author.followers} অনুসরণকারী
                  </p>
                </div>
                <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors bengali-text">
                  অনুসরণ
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Star className="h-5 w-5 text-yellow-400" fill="currentColor" />
                    <span className="text-2xl font-bold">{story.rating}</span>
                  </div>
                  <p className="text-blue-100 text-sm bengali-text">
                    ({story.totalRatings.toLocaleString()})
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Clock className="h-5 w-5 text-blue-200" />
                    <span className="text-lg font-semibold bengali-text">{story.readTime}</span>
                  </div>
                  <p className="text-blue-100 text-sm bengali-text">পঠন সময়</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Eye className="h-5 w-5 text-blue-200" />
                    <span className="text-lg font-semibold">{story.views}</span>
                  </div>
                  <p className="text-blue-100 text-sm bengali-text">পাঠকসংখ্যা</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <BookOpen className="h-5 w-5 text-blue-200" />
                    <span className="text-lg font-semibold">{story.totalChapters}</span>
                  </div>
                  <p className="text-blue-100 text-sm bengali-text">অধ্যায়</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href={`/story/${story.id}/chapter/1`}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition-colors bengali-text"
                >
                  <Play className="h-5 w-5" />
                  <span>এখন পড়ুন</span>
                </Link>
                
                <button
                  onClick={handleBookmark}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isBookmarked 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <BookOpen className="h-5 w-5" />
                </button>

                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isLiked 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                </button>

                <button className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-lg font-medium transition-colors">
                  <Download className="h-5 w-5" />
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {story.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="bg-white/20 px-3 py-1 rounded-full text-sm bengali-text"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story Description */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 bengali-text">গল্পের বিবরণ</h2>
          <p className="text-gray-700 leading-relaxed bengali-text text-lg">
            {story.description}
          </p>
          <div className="mt-4 flex items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span className="bengali-text">প্রকাশিত: {story.publishDate}</span>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 bengali-text">Chapters</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {story.chapters.map((chapter: any, index: number) => (
              <div key={chapter.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl font-bold text-gray-400 w-8">
                        {chapter.id}.
                      </span>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 bengali-text mb-1">
                          {chapter.title}
                        </h3>
                        {chapter.isLocked && (
                          <p className="text-sm text-orange-600 bengali-text mb-2">
                            {chapter.lockMessage}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{chapter.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{chapter.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span className="bengali-text">{chapter.readTime}</span>
                          </div>
                          <span className="bengali-text">{chapter.publishDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {chapter.isLocked ? (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <Lock className="h-5 w-5" />
                        <span className="text-sm font-medium bengali-text">প্রিমিয়াম</span>
                      </div>
                    ) : (
                      <Link
                        href={`/story/${story.id}/chapter/${chapter.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors bengali-text flex items-center space-x-2"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>পড়ুন</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}