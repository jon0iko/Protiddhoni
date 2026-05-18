/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Loader2,
  BookOpen
} from 'lucide-react';
import ContentCard from '@/components/content/ContentCard';
import { api } from '@/lib/api';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<any>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryData();
  }, [slug]);

  const loadCategoryData = async () => {
    setLoading(true);
    try {
      const [categoryRes, contentsRes] = await Promise.all([
        api.categories.getBySlug(slug),
        api.content.getByCategory(slug)
      ]);

      if (categoryRes.success) {
        setCategory(categoryRes.data);
      } else {
        router.push('/404');
        return;
      }

      if (contentsRes.success) {
        setContents(contentsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading category:', error);
      router.push('/404');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!category) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="bengali-text">ফিরে যান</span>
          </button>

          <div className="flex items-start gap-2 mb-4">
            <BookOpen className="w-8 h-8" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 bengali-text leading-tight">
            {category.name}
          </h1>

          {category.description && (
            <p className="text-xl text-white/90 mb-6 bengali-text leading-relaxed max-w-3xl">
              {category.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-white/80">
            <span className="bengali-text">{contents.length} টি কন্টেন্ট</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {contents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map(content => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 bengali-text">কোনো কন্টেন্ট নেই</h2>
            <p className="text-gray-600 bengali-text">এই বিভাগে এখনো কোনো কন্টেন্ট যুক্ত করা হয়নি</p>
          </div>
        )}
      </div>
    </div>
  );
}


