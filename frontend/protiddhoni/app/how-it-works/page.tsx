'use client';

import { 
  UserPlus, 
  Edit3, 
  Upload, 
  Eye, 
  Heart, 
  Star,
  ArrowRight,
  BookOpen,
  MessageCircle,
  TrendingUp,
  Award
} from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: <UserPlus className="w-8 h-8" />,
    title: "অ্যাকাউন্ট তৈরি করুন",
    description: "বিনামূল্যে সাইন আপ করুন এবং আপনার প্রোফাইল সেট করুন",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: 2,
    icon: <Edit3 className="w-8 h-8" />,
    title: "লিখুন এবং সৃজনশীল হন",
    description: "আমাদের উন্নত এডিটর ব্যবহার করে আপনার গল্প, কবিতা বা প্রবন্ধ লিখুন",
    color: "from-green-500 to-green-600"
  },
  {
    id: 3,
    icon: <Upload className="w-8 h-8" />,
    title: "প্রকাশ করুন",
    description: "আপনার লেখা প্রকাশ করুন এবং হাজারো পাঠকের কাছে পৌঁছান",
    color: "from-purple-500 to-purple-600"
  },
  {
    id: 4,
    icon: <Eye className="w-8 h-8" />,
    title: "পাঠক পান",
    description: "আপনার লেখা পড়বেন অসংখ্য পাঠক এবং পাবেন তাদের মতামত",
    color: "from-orange-500 to-orange-600"
  }
];

const features = [
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "বিনামূল্যে পড়ুন",
    description: "হাজারো গল্প, কবিতা এবং প্রবন্ধ পড়ুন সম্পূর্ণ বিনামূল্যে",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600"
  },
  {
    icon: <Edit3 className="w-6 h-6" />,
    title: "সহজ লেখালেখি",
    description: "আমাদের উন্নত এডিটর দিয়ে সুন্দর করে লিখুন এবং সাজান",
    bgColor: "bg-green-50",
    iconColor: "text-green-600"
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "মতামত এবং পরামর্শ",
    description: "পাঠকদের সাথে সরাসরি যোগাযোগ এবং মতামত বিনিময়",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600"
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "জনপ্রিয়তা ট্র্যাকিং",
    description: "দেখুন আপনার লেখা কতটা জনপ্রিয়, কত পাঠক পড়েছেন",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600"
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: "রেটিং এবং রিভিউ",
    description: "পাঠকদের রেটিং এবং বিস্তারিত রিভিও পান আপনার লেখার জন্য",
    bgColor: "bg-red-50",
    iconColor: "text-red-600"
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "সম্মাননা এবং ব্যাজ",
    description: "ভালো লেখার জন্য পান বিশেষ ব্যাজ এবং সম্মাননা",
    bgColor: "bg-indigo-50",
    iconColor: "text-indigo-600"
  }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bengali-text">
            কীভাবে কাজ করে
          </h1>
          <p className="text-lg text-gray-600 bengali-text leading-relaxed max-w-2xl mx-auto">
            প্রতিধ্বনিতে লেখালেখি এবং পড়াশোনা কতটা সহজ তা জানুন মাত্র কয়েকটি ধাপে
          </p>
        </div>

        {/* How to Start Steps */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12 bengali-text">
            শুরু করার ধাপসমূহ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className={`bg-gradient-to-r ${step.color} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {step.icon}
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 bengali-text">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm bengali-text">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12 bengali-text">
            আমাদের সুবিধাসমূহ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className={`${feature.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <span className={feature.iconColor}>
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 bengali-text">
                  {feature.title}
                </h3>
                <p className="text-gray-600 bengali-text">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* For Readers Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 bengali-text">
              পাঠকদের জন্য
            </h3>
            <ul className="space-y-3 text-gray-700 bengali-text">
              <li className="flex items-start space-x-3">
                <Heart className="w-5 h-5 text-red-500 mt-0.5" />
                <span>হাজারো বিনামূল্যের গল্প এবং কবিতা পড়ুন</span>
              </li>
              <li className="flex items-start space-x-3">
                <BookOpen className="w-5 h-5 text-blue-500 mt-0.5" />
                <span>বিভিন্ন ক্যাটাগরি অনুযায়ী খুঁজে নিন পছন্দের লেখা</span>
              </li>
              <li className="flex items-start space-x-3">
                <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                <span>প্রিয় লেখাগুলো বুকমার্ক করুন পরে পড়ার জন্য</span>
              </li>
              <li className="flex items-start space-x-3">
                <MessageCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <span>লেখকদের সাথে সরাসরি মতামত দিন এবং উৎসাহ যোগান</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 bengali-text">
              লেখকদের জন্য
            </h3>
            <ul className="space-y-3 text-gray-700 bengali-text">
              <li className="flex items-start space-x-3">
                <Edit3 className="w-5 h-5 text-blue-500 mt-0.5" />
                <span>উন্নত এডিটর দিয়ে সুন্দর করে লিখুন এবং সাজান</span>
              </li>
              <li className="flex items-start space-x-3">
                <Upload className="w-5 h-5 text-purple-500 mt-0.5" />
                <span>এক ক্লিকেই প্রকাশ করুন আপনার সৃজনশীল কাজ</span>
              </li>
              <li className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-orange-500 mt-0.5" />
                <span>ট্র্যাক করুন আপনার লেখার জনপ্রিয়তা এবং পরিসংখ্যান</span>
              </li>
              <li className="flex items-start space-x-3">
                <Award className="w-5 h-5 text-red-500 mt-0.5" />
                <span>ভালো লেখার জন্য পান বিশেষ ব্যাজ এবং স্বীকৃতি</span>
              </li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8 bengali-text">
            সাধারণ প্রশ্নাবলী
          </h2>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2 bengali-text">
                প্রতিধ্বনি কি সম্পূর্ণ বিনামূল্যে?
              </h4>
              <p className="text-gray-600 bengali-text">
                হ্যাঁ, প্রতিধ্বনি সম্পূর্ণ বিনামূল্যে। আপনি বিনামূল্যে পড়তে এবং লিখতে পারেন।
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2 bengali-text">
                আমার লেখা কি সুরক্ষিত থাকবে?
              </h4>
              <p className="text-gray-600 bengali-text">
                অবশ্যই। আপনার সব লেখার কপিরাইট আপনার কাছেই থাকবে। আমরা শুধু প্রকাশের অনুমতি রাখি।
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2 bengali-text">
                কোন ধরনের লেখা প্রকাশ করা যায়?
              </h4>
              <p className="text-gray-600 bengali-text">
                গল্প, কবিতা, উপন্যাস, প্রবন্ধ - যেকোনো ধরনের সৃজনশীল লেখা প্রকাশ করতে পারেন।
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4 bengali-text">
              আজই শুরু করুন আপনার সাহিত্যিক যাত্রা
            </h3>
            <p className="text-lg mb-6 bengali-text">
              প্রতিধ্বনিতে যোগ দিন এবং হয়ে উঠুন বাংলা সাহিত্যের অংশ
            </p>
            <a 
              href="/register" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors bengali-text inline-block"
            >
              বিনামূল্যে যোগদান করুন
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}