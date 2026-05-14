/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Eye, Star, Clock, Edit, Trash2, Plus, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import ContentCard from '@/components/content/ContentCard';

export default function MyStoriesPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/my-stories');
    } else if (isLoggedIn && user?.id) {
      loadMyContent();
    }
  }, [isLoggedIn, isLoading, user]);

  const loadMyContent = async () => {
    setLoading(true);
    try {
      if (!user?.id) return;
      
      const response = await api.content.getByAuthor(user.id);
      if (response.success) {
        setContents(response.data || []);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContents = contents.filter(content => {
    if (filter === 'all') return true;
    return content.status === filter;
  });

  const statusCounts = {
    all: contents.length,
    approved: contents.filter(c => c.status === 'approved').length,
    pending: contents.filter(c => c.status === 'pending').length,
    rejected: contents.filter(c => c.status === 'rejected').length,
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">আমার লেখা</h1>
            <p className="text-gray-600">{contents.length}টি রচনা</p>
          </div>
          <Link
            href="/write/editor"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>নতুন লেখা</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-6">
            {[
              { key: 'all', label: 'সব', icon: BookOpen },
              { key: 'approved', label: 'প্রকাশিত', icon: CheckCircle },
              { key: 'pending', label: 'পর্যালোচনাধীন', icon: AlertCircle },
              { key: 'rejected', label: 'প্রত্যাখ্যাত', icon: XCircle },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  filter === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                  {statusCounts[key as keyof typeof statusCounts]}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Grid */}
        {filteredContents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">কোনো রচনা নেই</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? 'আপনার প্রথম রচনা লিখুন এবং প্রকাশ করুন'
                : `এই বিভাগে কোনো রচনা নেই`}
            </p>
            <Link
              href="/write/editor"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              লেখা শুরু করুন
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContents.map((content) => (
              <ContentCard key={content.id} content={content} showStatus />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
