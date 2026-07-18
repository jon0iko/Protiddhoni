
import { BookOpen, Users, Heart, Award, Target, Eye } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bengali-text">
            আমাদের সম্পর্কে
          </h1>
          <p className="text-lg text-gray-600 bengali-text leading-relaxed">
            প্রতিধ্বনি - বাংলা সাহিত্যের ডিজিটাল যুগের সেতুবন্ধন
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900 bengali-text">আমাদের লক্ষ্য</h2>
          </div>
          <p className="text-gray-700 leading-relaxed bengali-text text-lg">
            প্রতিধ্বনি একটি ডিজিটাল প্ল্যাটফর্ম যা বাংলা ভাষার সাহিত্যচর্চাকে আধুনিক যুগের সাথে তাল মিলিয়ে এগিয়ে নিয়ে যেতে প্রতিশ্রুতিবদ্ধ। 
            আমাদের উদ্দেশ্য হলো নতুন এবং প্রতিষ্ঠিত লেখকদের জন্য একটি উন্মুক্ত মঞ্চ তৈরি করা, যেখানে তারা তাদের সৃজনশীলতা প্রকাশ করতে পারেন এবং পাঠকদের সাথে সরাসরি যুক্ত হতে পারেন।
          </p>
        </div>

        {/* Vision */}
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-200 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Eye className="w-6 h-6 text-accent-600" />
            <h2 className="text-2xl font-bold text-gray-900 bengali-text">আমাদের স্বপ্ন</h2>
          </div>
          <p className="text-gray-700 leading-relaxed bengali-text text-lg">
            আমরা স্বপ্ন দেখি এমন একটি বিশ্বের যেখানে বাংলা সাহিত্য বিশ্বব্যাপী পৌঁছে যাবে। প্রতিধ্বনির মাধ্যমে আমরা চাই যে প্রতিটি বাংলা ভাষী মানুষ 
            তাদের মাতৃভাষায় গুণগত সাহিত্য পড়তে এবং লিখতে পারুক। আমাদের প্ল্যাটফর্ম হবে সাহিত্যপ্রেমীদের একটি বৈশ্বিক সম্প্রদায়।
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpen className="w-8 h-8 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900 bengali-text">বিনামূল্যে পড়ুন</h3>
            </div>
            <p className="text-gray-600 bengali-text">
              হাজারো গল্প, কবিতা এবং উপন্যাস সম্পূর্ণ বিনামূল্যে পড়ুন। আমাদের লাইব্রেরিতে রয়েছে বিভিন্ন ধরনের সাহিত্য।
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-8 h-8 text-primary-600" />
              <h3 className="text-xl font-bold text-gray-900 bengali-text">সম্প্রদায়</h3>
            </div>
            <p className="text-gray-600 bengali-text">
              লেখক এবং পাঠকদের মধ্যে সরাসরি যোগাযোগ। মতামত, পরামর্শ এবং উৎসাহের মাধ্যমে একসাথে এগিয়ে চলুন।
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Heart className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900 bengali-text">সহজ প্রকাশনা</h3>
            </div>
            <p className="text-gray-600 bengali-text">
              আপনার লেখা প্রকাশ করুন সহজেই। আমাদের উন্নত এডিটর দিয়ে সুন্দর করে সাজিয়ে নিন আপনার সৃজনশীল কাজ।
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Award className="w-8 h-8 text-yellow-600" />
              <h3 className="text-xl font-bold text-gray-900 bengali-text">গুণগত মান</h3>
            </div>
            <p className="text-gray-600 bengali-text">
              আমরা নিশ্চিত করি যে প্রতিটি লেখা উচ্চমানের হয়। আমাদের কমিউনিটি রিভিউ সিস্টেম সাহায্য করে সেরা লেখাগুলো খুঁজে বের করতে।
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8 bengali-text">
            আমাদের টিম
          </h2>
          <div className="text-center">
            <p className="text-gray-600 bengali-text leading-relaxed">
              প্রতিধ্বনি তৈরি করেছে একদল সাহিত্যপ্রেমী এবং প্রযুক্তিবিদ। আমাদের দলে রয়েছে অভিজ্ঞ সফটওয়্যার ইঞ্জিনিয়ার, 
              সাহিত্যিক, এবং ডিজাইনার যারা বাংলা সাহিত্যের উন্নতির জন্য নিরলসভাবে কাজ করে যাচ্ছেন।
            </p>
            <div className="mt-6 inline-flex items-center space-x-2 text-gray-500">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="bengali-text">ভালোবাসা এবং আবেগ দিয়ে তৈরি</span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4 bengali-text">
              আমাদের যাত্রায় অংশ নিন
            </h3>
            <p className="text-lg mb-6 bengali-text">
              প্রতিধ্বনির সাথে যুক্ত হয়ে বাংলা সাহিত্যের ভবিষ্যৎ গড়তে সাহায্য করুন
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/register" 
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors bengali-text"
              >
                যোগদান করুন
              </a>
              <a 
                href="/contact" 
                className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors bengali-text"
              >
                যোগাযোগ করুন
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}