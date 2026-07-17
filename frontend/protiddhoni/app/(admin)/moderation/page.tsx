/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Eye, Clock, User, Loader2, AlertTriangle, EyeOff, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

type Tab = 'pending' | 'published';

export default function ModerationPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [pendingContents, setPendingContents] = useState<any[]>([]);
  const [publishedContents, setPublishedContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [unpublishReason, setUnpublishReason] = useState('');
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/login?redirect=/admin/moderation');
      } else if (!user?.is_admin) {
        router.push('/');
        alert('আপনার এই পেজে প্রবেশাধিকার নেই।');
      } else {
        loadContent();
      }
    }
  }, [isLoggedIn, authLoading, user]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const [pendingRes, publishedRes] = await Promise.all([
        api.content.getPending(),
        api.content.getPublished({ paginated: 'true', limit: '50' })
      ]);

      if (pendingRes.success) {
        setPendingContents(pendingRes.data || []);
      }
      if (publishedRes.success) {
        setPublishedContents(publishedRes.data || []);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contentId: string) => {
    if (!confirm('এই রচনাটি অনুমোদন করতে চান?')) return;

    setProcessing(contentId);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await api.content.approve(contentId);
      setPendingContents(pendingContents.filter(c => c.id !== contentId));
      alert('রচনাটি অনুমোদিত এবং প্রকাশিত হয়েছে।');
    } catch (error) {
      console.error('Error approving content:', error);
      alert('অনুমোদন করতে সমস্যা হয়েছে।');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (content: any) => {
    setSelectedContent(content);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('প্রত্যাখ্যানের কারণ লিখুন।');
      return;
    }

    setProcessing(selectedContent.id);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      await api.content.reject(selectedContent.id, rejectionReason);
      setPendingContents(pendingContents.filter(c => c.id !== selectedContent.id));
      setShowRejectModal(false);
      setSelectedContent(null);
      alert('রচনাটি প্রত্যাখ্যাত হয়েছে।');
    } catch (error) {
      console.error('Error rejecting content:', error);
      alert('প্রত্যাখ্যান করতে সমস্যা হয়েছে।');
    } finally {
      setProcessing(null);
    }
  };

  const handleUnpublish = (content: any) => {
    setSelectedContent(content);
    setShowUnpublishModal(true);
    setUnpublishReason('');
  };

  const confirmUnpublish = async () => {
    setProcessing(selectedContent.id);
    try {
      await api.content.unpublish(selectedContent.id, unpublishReason || undefined);
      setPublishedContents(publishedContents.filter(c => c.id !== selectedContent.id));
      setShowUnpublishModal(false);
      setSelectedContent(null);
      alert('রচনাটি অপ্রকাশিত করা হয়েছে।');
    } catch (error) {
      console.error('Error unpublishing content:', error);
      alert('অপ্রকাশিত করতে সমস্যা হয়েছে।');
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading || loading) {
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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 bengali-text">কন্টেন্ট পর্যালোচনা</h1>
            <p className="text-gray-600 bengali-text">
              {activeTab === 'pending'
                ? `${pendingContents.length}টি রচনা পর্যালোচনার জন্য অপেক্ষামান`
                : `${publishedContents.length}টি প্রকাশিত রচনা`}
            </p>
          </div>
          <Link
            href="/admin/review/history"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors bengali-text text-sm"
          >
            <History className="w-4 h-4" />
            <span>অ্যাকশন ইতিহাস</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors bengali-text ${
              activeTab === 'pending'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            পর্যালোচনা ({pendingContents.length})
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors bengali-text ${
              activeTab === 'published'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            প্রকাশিত রচনা ({publishedContents.length})
          </button>
        </div>

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <>
            {pendingContents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2 bengali-text">সব রচনা পর্যালোচিত</h3>
                <p className="text-gray-500 bengali-text">এই মুহূর্তে পর্যালোচনার জন্য কোনো রচনা নেই।</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingContents.map((content) => (
                  <div key={content.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 bengali-text">{content.title}</h2>
                        {content.excerpt && (
                          <p className="text-gray-600 mb-3 line-clamp-2 bengali-text">{content.excerpt}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span className="bengali-text">{content.author?.full_name || content.author?.username}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatRelativeTime(content.created_at)}</span>
                          </div>
                          {content.category && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 bengali-text">
                              {content.category.name}
                            </span>
                          )}
                          {content.content_type && (
                            <span className="px-2 py-1 bg-blue-100 rounded text-blue-700 bengali-text">
                              {content.content_type === 'story' && 'গল্প'}
                              {content.content_type === 'poem' && 'কবিতা'}
                              {content.content_type === 'chapter' && 'পর্ব'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                      <div 
                        className="prose prose-sm max-w-none bengali-text"
                        dangerouslySetInnerHTML={{ __html: content.body?.substring(0, 500) + '...' || '' }}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <button
                        onClick={() => handleApprove(content.id)}
                        disabled={processing === content.id}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 bengali-text"
                      >
                        {processing === content.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        <span>অনুমোদন করুন</span>
                      </button>
                      <button
                        onClick={() => handleReject(content)}
                        disabled={processing === content.id}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 bengali-text"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>প্রত্যাখ্যান করুন</span>
                      </button>
                      <a
                        href={`/read/${content.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors bengali-text"
                      >
                        <Eye className="w-5 h-5" />
                        <span>পূর্ণ দেখুন</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Published Tab */}
        {activeTab === 'published' && (
          <>
            {publishedContents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2 bengali-text">কোনো প্রকাশিত রচনা নেই</h3>
                <p className="text-gray-500 bengali-text">এই মুহূর্তে কোনো প্রকাশিত রচনা পাওয়া যায়নি।</p>
              </div>
            ) : (
              <div className="space-y-4">
                {publishedContents.map((content) => (
                  <div key={content.id} className="bg-white rounded-lg border border-gray-200 p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="text-lg font-semibold text-gray-900 truncate bengali-text">{content.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span className="bengali-text">{content.author?.full_name || content.author?.username}</span>
                        </span>
                        {content.category && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 text-xs bengali-text">
                            {content.category.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{content.view_count || 0}</span>
                        </span>
                        <span className="text-xs text-gray-400">{formatRelativeTime(content.published_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`/read/${content.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm bengali-text"
                      >
                        <Eye className="w-4 h-4" />
                        <span>দেখুন</span>
                      </a>
                      <button
                        onClick={() => handleUnpublish(content)}
                        disabled={processing === content.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-sm disabled:opacity-50 bengali-text"
                      >
                        <EyeOff className="w-4 h-4" />
                        <span>অপ্রকাশিত করুন</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900 bengali-text">রচনা প্রত্যাখ্যান</h3>
            </div>
            <p className="text-gray-600 mb-4 bengali-text">প্রত্যাখ্যানের কারণ লিখুন:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 bengali-text"
              rows={4}
              placeholder="যেমন: বিষযবস্তু উপযুক্ত নয়, ভাষাগত সমস্যা ইত্যাদি"
            />
            <div className="flex gap-3">
              <button
                onClick={confirmReject}
                disabled={!!processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 bengali-text"
              >
                {processing ? 'প্রক্রিয়াকরণ...' : 'নিশ্চিত করুন'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedContent(null);
                }}
                disabled={!!processing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 bengali-text"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Modal */}
      {showUnpublishModal && selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <EyeOff className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900 bengali-text">রচনা অপ্রকাশিত করুন</h3>
            </div>
            <p className="text-gray-600 mb-2 bengali-text">
              &quot;{selectedContent.title}&quot; অপ্রকাশিত করতে চান?
            </p>
            <p className="text-sm text-gray-500 mb-4 bengali-text">
              এই রচনাটি সবার কাছ থেকে লুকানো হবে। শুধুমাত্র অ্যাকশন ইতিহাস থেকে পুনরায় প্রকাশ করা যাবে।
            </p>
            <textarea
              value={unpublishReason}
              onChange={(e) => setUnpublishReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 bengali-text"
              rows={3}
              placeholder="অপ্রকাশিত করার কারণ (ঐচ্ছিক)"
            />
            <div className="flex gap-3">
              <button
                onClick={confirmUnpublish}
                disabled={!!processing}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 bengali-text"
              >
                {processing ? 'প্রক্রিয়াকরণ...' : 'অপ্রকাশিত করুন'}
              </button>
              <button
                onClick={() => {
                  setShowUnpublishModal(false);
                  setSelectedContent(null);
                }}
                disabled={!!processing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 bengali-text"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
