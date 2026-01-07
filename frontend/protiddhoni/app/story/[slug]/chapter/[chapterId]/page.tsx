'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowRight, 
  Star, 
  MessageCircle, 
  Heart, 
  Bookmark,
  Share2,
  Settings,
  Moon,
  Sun,
  Type,
  Palette,
  ChevronUp,
  ChevronDown,
  User,
  Send,
  MoreHorizontal,
  Flag,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Mock data
const getChapterData = (storySlug: string, chapterId: string) => {
  const storyTitles: { [key: string]: string } = {
    'ontoraler-golpo': 'অন্তরালের গল্প',
    'mayer-chithi': 'মায়ের চিঠি',
    'rater-nishobdota': 'রাতের নিঃশব্দতা',
    'boshonter-kobita': 'বসন্তের কবিতা'
  };

  return {
    id: parseInt(chapterId),
    storyId: storySlug,
    title: storyTitles[storySlug] || 'শান্তরী',
  content: `দেশের নামকরা নিউজ চ্যানেলগুলোতে রেগুলার নিউজ হিসেবে একটা খবর বারবার দেখানো হচ্ছে, "বিদেশে মাত্রিত্বে অনুষ্ঠিত আন্তর্জাতিক টুর্নামেন্ট উদঘাটন কালে প্রথমবার অংশগ্রহণ করার সুযোগ পেয়ে দমদম এয়ারপোর্ট গেইট নং ২-এ পৌঁছানোর আগেই প্রবাসী বাংলাদেশি তরুণ শান্ত বঙ্গ গুরুত্বর আহত হয়ে হাসপাতালে ভর্তি হয়েছেন। আটঁটিগ্রাস ডুবলি না কাটালে ডাক্তারা কোনো আশা দিতে পারছেন না।"

এই ঘটনার কথা জানার পর ক্রিকেটারো মানুষের মনে নানান প্রশ্ন ঘুরে ফিরছে। কলকাতার এক নামী সংবাদ পত্রে মোখা হয়েছে,

" বঙ্গ তনয়া শান্তরী বঙ্গের হৃদয়ের উদান কি খোলা শুকুর আতোনেই করিম ব্যান্ডের রূকে মুখ ধুরলে পড়ে চিরকালের জন্য বিফল্যতের অন্ধকারে হারিয়ে যাবে? নাকি তার কষ্মনা হার না মানা আদময তেজ আবার তাকে উঠে দিরিয়ে সাহায়ক করবে? "

প্রকাশো কেউ কিছু না বলতেও অনেকের মনে যে প্রশ্নটা উঁকি দিয়ে যাচ্ছে সেটা হলো - এটা কি নিছক কোনো দুর্ঘটনা? নাকি এর পিছনে কিন্ত আছে অন্য কোনো রহস্য?

দেশের সরবাদ মাধ্যম বা মাধ্যরণ মানুষের মধ্যে যাকে নিয়ে এত আলোচনার বন্যা উঠেছে সেই মেয়েটার কাছে

পৃষ্ঠা নং ১০৪`,
  author: {
    name: 'মেঘবর্ণ',
    avatar: 'https://ui-avatars.com/api/?name=মেঘবর্ণ&background=4F46E5&color=fff'
  },
  stats: {
    rating: 4.8,
    totalRatings: 1250,
    comments: 89,
    likes: 2340,
    bookmarks: 567
  },
  navigation: {
    previousChapter: null,
    nextChapter: { id: 2, title: 'শান্তরী ( পর্ব - দুই )' }
  },
  comments: [
    {
      id: 1,
      user: {
        name: 'রাহুল আহমেদ',
        avatar: 'https://ui-avatars.com/api/?name=রাহুল আহমেদ&background=random'
      },
      content: 'অসাধারণ লেখা! গল্পের শুরুটা খুবই আকর্ষণীয়।',
      likes: 23,
      time: '২ ঘন্টা আগে',
      replies: []
    },
    {
      id: 2,
      user: {
        name: 'সারা খান',
        avatar: 'https://ui-avatars.com/api/?name=সারা খান&background=FF69B4&color=fff'
      },
      content: 'পরের অংশের জন্য অপেক্ষা করছি।',
      likes: 15,
      time: '১ ঘন্টা আগে',
      replies: [
        {
          id: 11,
          user: {
            name: 'মেঘবর্ণ',
            avatar: 'https://ui-avatars.com/api/?name=মেঘবর্ণ&background=4F46E5&color=fff'
          },
          content: 'ধন্যবাদ! শীঘ্রই আসছে।',
          likes: 8,
          time: '৩০ মিনিট আগে'
        }
      ]
    }
  ]
  };
};

export default function ChapterReadingPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  
  const [chapter, setChapter] = useState<any>(null);
  const [userRating, setUserRating] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Reading settings
  const [fontSize, setFontSize] = useState(18);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontFamily, setFontFamily] = useState('kalpurush');

  useEffect(() => {
    const chapterData = getChapterData(params.slug as string, params.chapterId as string);
    setChapter(chapterData);
  }, [params.slug, params.chapterId]);

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const handleRatingChange = (rating: number) => {
    setUserRating(rating);
    // TODO: Send to API
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Send to API
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Send to API
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;
    // TODO: Send to API
    setNewComment('');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: chapter.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('লিংক কপি করা হয়েছে!');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-semibold bengali-text">{chapter.title}</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  অধ্যায় {chapter.id}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleShare}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reading Settings Panel */}
      {showSettings && (
        <div className={`border-b transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center gap-6">
              {/* Font Size */}
              <div className="flex items-center space-x-2">
                <Type className="h-4 w-4" />
                <span className="text-sm font-medium">ফন্ট সাইজ:</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                    className={`p-1 rounded transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <span className="text-sm w-8 text-center">{fontSize}</span>
                  <button
                    onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                    className={`p-1 rounded transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                    isDarkMode ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-white'
                  }`}
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span className="text-sm">{isDarkMode ? 'হালকা' : 'গাঢ়'}</span>
                </button>
              </div>

              {/* Font Family */}
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className={`text-sm px-2 py-1 rounded border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="kalpurush">কালপুরুষ</option>
                  <option value="nikosh">নিকষ</option>
                  <option value="solaiman">সোলাইমান লিপি</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chapter Content */}
        <div className="prose max-w-none mb-12">
          <div 
            className={`leading-relaxed bengali-text transition-all duration-300 ${
              fontFamily === 'kalpurush' ? 'font-kalpurush' : 
              fontFamily === 'nikosh' ? 'font-serif' : 'font-sans'
            }`}
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            {chapter.content.split('\n\n').map((paragraph: string, index: number) => (
              <p key={index} className="mb-6">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Chapter Navigation */}
        <div className="flex items-center justify-between mb-8 py-6 border-t border-b border-gray-200">
          <div>
            {chapter.navigation.previousChapter ? (
              <Link
                href={`/story/${chapter.storyId}/chapter/${chapter.navigation.previousChapter.id}`}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="bengali-text">পূর্ববর্তী অধ্যায়</span>
              </Link>
            ) : (
              <div className={`text-gray-400 ${isDarkMode ? 'text-gray-600' : ''}`}>
                <span className="bengali-text">প্রথম অধ্যায়</span>
              </div>
            )}
          </div>
          
          <Link
            href={`/story/${chapter.storyId}`}
            className={`px-4 py-2 rounded-lg font-medium transition-colors bengali-text ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            সূচিপত্র
          </Link>
          
          <div>
            {chapter.navigation.nextChapter ? (
              <Link
                href={`/story/${chapter.storyId}/chapter/${chapter.navigation.nextChapter.id}`}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <span className="bengali-text">পরবর্তী অধ্যায়</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className={`text-gray-400 ${isDarkMode ? 'text-gray-600' : ''}`}>
                <span className="bengali-text">শেষ অধ্যায়</span>
              </div>
            )}
          </div>
        </div>

        {/* Interaction Section */}
        <div className={`rounded-2xl p-6 mb-8 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          {/* Rating */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 bengali-text">এই অধ্যায়টি রেটিং দিন</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className="transition-colors"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= userRating 
                          ? 'text-yellow-500 fill-current' 
                          : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ({chapter.stats.totalRatings} রেটিং)
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isLiked
                  ? 'bg-red-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="bengali-text">পছন্দ ({chapter.stats.likes})</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isBookmarked
                  ? 'bg-yellow-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              <span className="bengali-text">বুকমার্ক ({chapter.stats.bookmarks})</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="bengali-text">মন্তব্য ({chapter.stats.comments})</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className={`rounded-2xl p-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <h3 className="text-xl font-semibold mb-6 bengali-text">মন্তব্য সমূহ</h3>

            {/* Add Comment */}
            {isLoggedIn && (
              <div className="mb-6">
                <div className="flex space-x-3">
                  <img
                    src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=random'}
                    alt={user?.name || 'User'}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="আপনার মন্তব্য লিখুন..."
                      className={`w-full p-3 rounded-lg border transition-colors resize-none bengali-text ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim()}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <Send className="h-4 w-4" />
                        <span className="bengali-text">পোস্ট করুন</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {chapter.comments.map((comment: any) => (
                <div key={comment.id} className="space-y-3">
                  <div className="flex space-x-3">
                    <img
                      src={comment.user.avatar}
                      alt={comment.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className={`p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold bengali-text">{comment.user.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {comment.time}
                            </span>
                            <button className={`p-1 rounded hover:bg-gray-200 ${
                              isDarkMode ? 'hover:bg-gray-600' : ''
                            }`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className={`bengali-text ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {comment.content}
                        </p>
                        <div className="flex items-center space-x-4 mt-3">
                          <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{comment.likes}</span>
                          </button>
                          <button className="text-sm text-gray-500 hover:text-primary-600 bengali-text">
                            উত্তর দিন
                          </button>
                          <button className="text-sm text-gray-500 hover:text-red-600">
                            <Flag className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-6 mt-3 space-y-3">
                          {comment.replies.map((reply: any) => (
                            <div key={reply.id} className="flex space-x-3">
                              <img
                                src={reply.user.avatar}
                                alt={reply.user.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className={`flex-1 p-3 rounded-lg ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                              }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="text-sm font-semibold bengali-text">{reply.user.name}</h5>
                                  <span className={`text-xs ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {reply.time}
                                  </span>
                                </div>
                                <p className={`text-sm bengali-text ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {reply.content}
                                </p>
                                <div className="flex items-center space-x-3 mt-2">
                                  <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600">
                                    <ThumbsUp className="h-3 w-3" />
                                    <span>{reply.likes}</span>
                                  </button>
                                  <button className="text-xs text-gray-500 hover:text-primary-600 bengali-text">
                                    উত্তর দিন
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}