'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Search, BookOpen, Edit, Users, Shield } from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  // General Questions
  {
    id: 1,
    question: "প্রতিধ্বনি কী?",
    answer: "প্রতিধ্বনি হলো একটি বাংলা সাহিত্যের ডিজিটাল প্ল্যাটফর্ম যেখানে আপনি বিনামূল্যে গল্প, কবিতা এবং উপন্যাস পড়তে পারেন এবং নিজের লেখাও প্রকাশ করতে পারেন।",
    category: "general"
  },
  {
    id: 2,
    question: "এটি কি সম্পূর্ণ বিনামূল্যে?",
    answer: "হ্যাঁ, প্রতিধ্বনি সম্পূর্ণ বিনামূল্যে। আপনি বিনা খরচে সাইন আপ করতে পারেন, লেখা পড়তে পারেন এবং নিজের লেখা প্রকাশ করতে পারেন।",
    category: "general"
  },
  {
    id: 3,
    question: "কোন ধরনের লেখা প্রকাশ করা যায়?",
    answer: "আপনি গল্প, কবিতা, উপন্যাস, প্রবন্ধ এবং যেকোনো ধরনের সৃজনশীল লেখা প্রকাশ করতে পারেন। তবে অশ্লীল বা আপত্তিজনক বিষয়বস্তু নিষিদ্ধ।",
    category: "general"
  },

  // Reading Related
  {
    id: 4,
    question: "কীভাবে লেখা খুঁজে পাবো?",
    answer: "আপনি সার্চ বার ব্যবহার করে লেখা খুঁজতে পারেন, বিভাগ অনুযায়ী ব্রাউজ করতে পারেন, অথবা জনপ্রিয় এবং ট্রেন্ডিং লেখাগুলো দেখতে পারেন।",
    category: "reading"
  },
  {
    id: 5,
    question: "লেখা বুকমার্ক করা যায় কী?",
    answer: "হ্যাঁ, আপনি যেকোনো লেখা বুকমার্ক করতে পারেন এবং পরে আপনার প্রোফাইল থেকে সেগুলো পড়তে পারেন।",
    category: "reading"
  },
  {
    id: 6,
    question: "লেখকদের সাথে যোগাযোগ করা যায়?",
    answer: "হ্যাঁ, আপনি লেখাগুলোতে মন্তব্য করতে পারেন এবং লেখকদের সাথে সরাসরি যোগাযোগ করতে পারেন।",
    category: "reading"
  },

  // Writing Related
  {
    id: 7,
    question: "কীভাবে লেখা প্রকাশ করবো?",
    answer: "সাইন আপ করার পর 'লিখুন' বাটনে ক্লিক করুন, আপনার লেখা টাইপ করুন, ক্যাটাগরি এবং ট্যাগ যোগ করুন, তারপর 'প্রকাশ করুন' বাটনে ক্লিক করুন।",
    category: "writing"
  },
  {
    id: 8,
    question: "আমার লেখার কপিরাইট কার?",
    answer: "আপনার লেখার সম্পূর্ণ কপিরাইট আপনার কাছেই থাকবে। প্রতিধ্বনি শুধুমাত্র প্ল্যাটফর্মে প্রকাশের অনুমতি রাখে।",
    category: "writing"
  },
  {
    id: 9,
    question: "লেখা সম্পাদনা করা যায়?",
    answer: "হ্যাঁ, প্রকাশের পরেও আপনি আপনার লেখা সম্পাদনা করতে পারেন। আপনার প্রোফাইল থেকে 'আমার লেখা' সেকশনে গিয়ে সম্পাদনা করুন।",
    category: "writing"
  },
  {
    id: 10,
    question: "কীভাবে লেখার জনপ্রিয়তা বাড়াবো?",
    answer: "নিয়মিত লিখুন, গুণগত মানের লেখা প্রকাশ করুন, সঠিক ট্যাগ ব্যবহার করুন এবং অন্যদের লেখায় মন্তব্য করে সক্রিয় থাকুন।",
    category: "writing"
  },

  // Account Related
  {
    id: 11,
    question: "কীভাবে অ্যাকাউন্ট তৈরি করবো?",
    answer: "'যোগদান করুন' বাটনে ক্লিক করুন, আপনার নাম, ইমেইল এবং পাসওয়ার্ড দিন। তারপর ইমেইল ভেরিফিকেশন সম্পন্ন করুন।",
    category: "account"
  },
  {
    id: 12,
    question: "পাসওয়ার্ড ভুলে গেলে কী করবো?",
    answer: "লগইন পেজে 'পাসওয়ার্ড ভুলে গেছেন?' লিংকে ক্লিক করুন। আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হবে।",
    category: "account"
  },
  {
    id: 13,
    question: "প্রোফাইল কীভাবে আপডেট করবো?",
    answer: "আপনার প্রোফাইল পেজে যান এবং 'প্রোফাইল সম্পাদনা' বাটনে ক্লিক করে তথ্য আপডেট করুন।",
    category: "account"
  },

  // Technical Support
  {
    id: 14,
    question: "লেখা আপলোড করতে সমস্যা হচ্ছে?",
    answer: "ইন্টারনেট সংযোগ চেক করুন, ব্রাউজার রিফ্রেশ করুন। সমস্যা থাকলে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।",
    category: "support"
  },
  {
    id: 15,
    question: "মোবাইলে ব্যবহার করা যায়?",
    answer: "হ্যাঁ, প্রতিধ্বনি সম্পূর্ণ মোবাইল-ফ্রেন্ডলি। আপনি যেকোনো ডিভাইস থেকে ব্যবহার করতে পারেন।",
    category: "support"
  }
];

const categories = [
  { id: 'all', name: 'সব প্রশ্ন', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'general', name: 'সাধারণ', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'reading', name: 'পড়াশোনা', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'writing', name: 'লেখালেখি', icon: <Edit className="w-4 h-4" /> },
  { id: 'account', name: 'অ্যাকাউন্ট', icon: <Users className="w-4 h-4" /> },
  { id: 'support', name: 'সাহায্য', icon: <Shield className="w-4 h-4" /> }
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQs, setOpenFAQs] = useState<number[]>([]);

  const toggleFAQ = (id: number) => {
    if (openFAQs.includes(id)) {
      setOpenFAQs(openFAQs.filter(faqId => faqId !== id));
    } else {
      setOpenFAQs([...openFAQs, id]);
    }
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bengali-text">
            প্রশ্নোত্তর
          </h1>
          <p className="text-lg text-gray-600 bengali-text leading-relaxed">
            প্রতিধ্বনি সম্পর্কে সাধারণ প্রশ্ন এবং তাদের উত্তর
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="প্রশ্ন খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 bengali-text">
            বিভাগ অনুযায়ী খুঁজুন
          </h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  activeCategory === category.id
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.icon}
                <span className="bengali-text">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 bengali-text">
                কোনো প্রশ্ন পাওয়া যায়নি
              </h3>
              <p className="text-gray-600 bengali-text">
                অন্য কোনো বিভাগ বা অনুসন্ধান শব্দ চেষ্টা করুন
              </p>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 bengali-text pr-4">
                      {faq.question}
                    </h3>
                    {openFAQs.includes(faq.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
                {openFAQs.includes(faq.id) && (
                  <div className="px-6 pb-4">
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-gray-700 bengali-text leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4 bengali-text">
            আপনার প্রশ্নের উত্তর পাননি?
          </h3>
          <p className="text-lg mb-6 bengali-text">
            আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন, আমরা সাহায্য করতে প্রস্তুত
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors bengali-text"
            >
              যোগাযোগ করুন
            </a>
            <a 
              href="/guidelines" 
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors bengali-text"
            >
              নিয়মাবলী দেখুন
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}