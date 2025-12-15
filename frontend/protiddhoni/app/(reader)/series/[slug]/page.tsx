'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, User, Calendar, Eye, Star, Loader2, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function SeriesPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const slug = params.slug as string;

  const [series, setSeries] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeriesData();
  }, [slug]);

  const loadSeriesData = async () => {
    setLoading(true);
    try {
      // Load series details - find first chapter to get series info
      const response = await api.content.getPublished({ series_id: slug });
      if (response.success && response.data && response.data.length > 0) {
        const firstChapter = response.data[0];
        setSeries(firstChapter.series);
        setChapters(response.data.sort((a: any, b: any) => a.chapter_number - b.chapter_number));
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error('Error loading series:', error);
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

  if (!series) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Series Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-6">
            {series.cover_image_url && (
              <img
                src={series.cover_image_url}
                alt={series.title}
                className="w-32 h-48 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{series.title}</h1>
              {series.description && (
                <p className="text-gray-600 mb-4">{series.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{chapters.length} টি পর্ব</span>
                </div>
                {series.is_completed && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">সম্পূর্ণ</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">সকল পর্ব</h2>
          </div>
          <div className="divide-y">
            {chapters.map((chapter, index) => (
              <Link
                key={chapter.id}
                href={`/read/${chapter.slug}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        পর্ব {chapter.chapter_number}
                      </span>
                      {chapter.is_premium && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                          <Lock className="w-3 h-3" />
                          প্রিমিয়াম
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{chapter.title}</h3>
                    {chapter.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-2">{chapter.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{chapter.view_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(chapter.published_at).toLocaleDateString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
