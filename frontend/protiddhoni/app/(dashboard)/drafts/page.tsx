'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Clock, Trash2, Edit, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { formatRelativeTime, getExcerptFromHtml } from '@/lib/utils';

export default function DraftsPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/drafts');
    } else if (isLoggedIn) {
      loadDrafts();
    }
  }, [isLoggedIn, isLoading]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const response = await api.drafts.getMyDrafts();
      if (response.success) {
        setDrafts(response.data || []);
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm('আপনি কি এই খসড়াটি মুছে ফেলতে চান?')) return;

    setDeleting(draftId);
    try {
      await api.drafts.deleteDraft(draftId);
      setDrafts(drafts.filter(d => d.id !== draftId));
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('খসড়া মুছতে সমস্যা হয়েছে।');
    } finally {
      setDeleting(null);
    }
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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">খসড়া</h1>
            <p className="text-gray-600">{drafts.length}টি খসড়া সংরক্ষিত</p>
          </div>
          <Link
            href="/write/editor"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>নতুন লেখা</span>
          </Link>
        </div>

        {/* Drafts List */}
        {drafts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">কোনো খসড়া নেই</h3>
            <p className="text-gray-500 mb-6">আপনার লেখা শুরু করুন এবং এটি খসড়া হিসেবে সংরক্ষণ করুন</p>
            <Link
              href="/write/editor"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              লেখা শুরু করুন
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {draft.title || 'শিরোনামহীন'}
                    </h3>
                    {draft.body && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {getExcerptFromHtml(draft.body, 150)}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatRelativeTime(draft.updated_at)}</span>
                      </div>
                      {draft.content_type && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                          {draft.content_type === 'story' && 'গল্প'}
                          {draft.content_type === 'poem' && 'কবিতা'}
                          {draft.content_type === 'chapter' && 'পর্ব'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/write/editor?draft=${draft.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="সম্পাদনা"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      disabled={deleting === draft.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="মুছুন"
                    >
                      {deleting === draft.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
