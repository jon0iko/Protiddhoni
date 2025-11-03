'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, BookOpen, Feather, FileText, ChevronRight, Save, Eye, Settings } from 'lucide-react';

interface StoryType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const storyTypes: StoryType[] = [
  {
    id: 'short-story',
    name: 'ছোটগল্প',
    description: 'সংক্ষিপ্ত এবং প্রভাবশালী গল্প',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100'
  },
  {
    id: 'novel',
    name: 'উপন্যাস',
    description: 'দীর্ঘ এবং বিস্তৃত কাহিনী',
    icon: <FileText className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100'
  },
  {
    id: 'poetry',
    name: 'কবিতা',
    description: 'ছন্দময় এবং ভাবপ্রবণ রচনা',
    icon: <Feather className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100'
  },
  {
    id: 'article',
    name: 'প্রবন্ধ',
    description: 'তথ্যবহুল এবং বিশ্লেষণমূলক লেখা',
    icon: <PlusCircle className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100'
  }
];

export default function NewStoryPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('');

  const handleTypeSelection = (typeId: string) => {
    setSelectedType(typeId);
    // Navigate to the editor with the selected type
    router.push(`/write/editor?type=${typeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bengali-text">
            নতুন লেখা শুরু করুন
          </h1>
          <p className="text-lg text-gray-600 bengali-text">
            আপনি কী ধরনের লেখা তৈরি করতে চান?
          </p>
        </div>

        {/* Story Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {storyTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeSelection(type.id)}
              className={`${type.bgColor} border border-gray-200 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:scale-105 group`}
            >
              <div className="flex items-start space-x-4">
                <div className={`${type.color} p-3 rounded-lg bg-white shadow-sm group-hover:shadow-md transition-shadow`}>
                  {type.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${type.color} mb-2 bengali-text`}>
                    {type.name}
                  </h3>
                  <p className="text-gray-600 mb-4 bengali-text">
                    {type.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="bengali-text">শুরু করুন</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 bengali-text">
            দ্রুত অ্যাকশন
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/write/continue')}
              className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-blue-900 bengali-text">গল্প চালিয়ে যান</div>
                <div className="text-sm text-blue-600 bengali-text">পূর্বের কাজ সম্পাদনা করুন</div>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/drafts')}
              className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <div className="font-medium text-purple-900 bengali-text">খসড়া দেখুন</div>
                <div className="text-sm text-purple-600 bengali-text">অসম্পূর্ণ লেখা</div>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/write/settings')}
              className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900 bengali-text">সেটিংস</div>
                <div className="text-sm text-gray-600 bengali-text">লেখার পছন্দ</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}