'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Save, 
  Eye, 
  Settings, 
  ArrowLeft, 
  Image, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  Upload,
  Globe,
  Lock,
  Users
} from 'lucide-react';

interface StoryData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  coverImage: string;
  status: 'draft' | 'published' | 'private';
  language: string;
}

const categories = [
  'গল্প', 'কবিতা', 'উপন্যাস', 'প্রবন্ধ', 'রহস্য', 'রোমান্স', 'ইতিহাস', 'বিজ্ঞান কল্পকাহিনী'
];

const languages = [
  { code: 'bn', name: 'বাংলা' },
  { code: 'en', name: 'English' }
];

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyType = searchParams.get('type') || 'short-story';
  
  const [storyData, setStoryData] = useState<StoryData>({
    title: '',
    content: '',
    category: '',
    tags: [],
    coverImage: '',
    status: 'draft',
    language: 'bn'
  });

  const [showSettings, setShowSettings] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    // Count words in content
    const words = storyData.content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [storyData.content]);

  const handleSave = async (publish = false) => {
    setIsSaving(true);
    try {
      // Here you would typically save to your backend
      const saveData = {
        ...storyData,
        status: publish ? 'published' : 'draft',
        type: storyType,
        lastSaved: new Date().toISOString()
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saving story:', saveData);
      
      if (publish) {
        alert('গল্প সফলভাবে প্রকাশিত হয়েছে!');
      } else {
        alert('খসড়া সংরক্ষিত হয়েছে!');
      }
    } catch (error) {
      alert('সংরক্ষণে সমস্যা হয়েছে!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !storyData.tags.includes(tagInput.trim())) {
      setStoryData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setStoryData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getStoryTypeTitle = () => {
    switch (storyType) {
      case 'short-story': return 'ছোটগল্প';
      case 'novel': return 'উপন্যাস';
      case 'poetry': return 'কবিতা';
      case 'article': return 'প্রবন্ধ';
      default: return 'লেখা';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 bengali-text">
                  {getStoryTypeTitle()} লিখুন
                </h1>
                <p className="text-sm text-gray-500">
                  {wordCount} শব্দ • {storyData.status === 'draft' ? 'খসড়া' : 'প্রকাশিত'}
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors bengali-text disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'সংরক্ষণ...' : 'সংরক্ষণ'}</span>
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving || !storyData.title.trim() || !storyData.content.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors bengali-text disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Globe className="w-4 h-4" />
                <span>প্রকাশ করুন</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Editor */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Title Input */}
              <div className="p-6 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="আপনার গল্পের শিরোনাম লিখুন..."
                  value={storyData.title}
                  onChange={(e) => setStoryData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-3xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none bengali-text resize-none"
                />
              </div>

              {/* Toolbar */}
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 border-r border-gray-300 pr-3 mr-3">
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                      <Underline className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-1 border-r border-gray-300 pr-3 mr-3">
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1 border-r border-gray-300 pr-3 mr-3">
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                      <List className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                      <Quote className="w-4 h-4" />
                    </button>
                  </div>

                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                    <Image className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Editor */}
              <div className="p-6">
                <textarea
                  placeholder="আপনার গল্প এখানে লিখুন..."
                  value={storyData.content}
                  onChange={(e) => setStoryData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full h-96 text-lg text-gray-900 placeholder-gray-400 border-none outline-none resize-none bengali-text leading-relaxed"
                  style={{ minHeight: '500px' }}
                />
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          {showSettings && (
            <div className="w-80">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 bengali-text">
                  গল্পের বিবরণ
                </h3>

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    বিভাগ
                  </label>
                  <select
                    value={storyData.category}
                    onChange={(e) => setStoryData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                  >
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    ট্যাগ
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="ট্যাগ যোগ করুন"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {storyData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full bengali-text"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    ভাষা
                  </label>
                  <select
                    value={storyData.language}
                    onChange={(e) => setStoryData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bengali-text"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    প্রকাশনার অবস্থা
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="draft"
                        checked={storyData.status === 'draft'}
                        onChange={(e) => setStoryData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="mr-3"
                      />
                      <span className="bengali-text">খসড়া</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="private"
                        checked={storyData.status === 'private'}
                        onChange={(e) => setStoryData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="mr-3"
                      />
                      <span className="bengali-text">ব্যক্তিগত</span>
                    </label>
                  </div>
                </div>

                {/* Cover Image */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                    কভার ছবি
                  </label>
                  <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 bengali-text">ছবি আপলোড করুন</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}