'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Loader2, CheckCircle, XCircle, Eye, Calendar, User as UserIcon, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface PendingContent {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  excerpt: string;
  body: string;
  author_id: string;
  author?: {
    id: string;
    username: string;
    full_name: string;
    profile_picture_url?: string;
  };
  created_at: string;
  updated_at: string;
  status: string;
  category?: {
    name: string;
  };
}

export default function AdminReviewPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<PendingContent | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !user?.is_admin)) {
      router.push('/');
      return;
    }

    if (isLoggedIn && user?.is_admin) {
      loadPendingContent();
    }
  }, [isLoggedIn, isLoading, user, router]);

  const loadPendingContent = async () => {
    setLoading(true);
    try {
      const response = await api.content.getPending();
      if (response.success) {
        setPendingContent(response.data || []);
      }
    } catch (error) {
      console.error('Error loading pending content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contentId: string) => {
    if (!confirm('আপনি কি এই লেখা অনুমোদন করতে চান?')) return;

    setProcessingId(contentId);
    try {
      const response = await api.content.approve(contentId);
      if (response.success) {
        alert('লেখা অনুমোদিত হয়েছে!');
        setPendingContent(prev => prev.filter(c => c.id !== contentId));
      }
    } catch (error) {
      console.error('Error approving content:', error);
      alert('লেখা অনুমোদনে সমস্যা হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (content: PendingContent) => {
    setSelectedContent(content);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const handleRejectSubmit = async () => {
    if (!selectedContent || !rejectionReason.trim()) {
      alert('প্রত্যাখ্যানের কারণ লিখুন');
      return;
    }

    setProcessingId(selectedContent.id);
    try {
      const response = await api.content.reject(selectedContent.id, rejectionReason);
      if (response.success) {
        alert('লেখা প্রত্যাখ্যান করা হয়েছে');
        setPendingContent(prev => prev.filter(c => c.id !== selectedContent.id));
        setShowRejectModal(false);
        setSelectedContent(null);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error rejecting content:', error);
      alert('লেখা প্রত্যাখ্যানে সমস্যা হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 bengali-text">পর্যালোচনা প্যানেল</h1>
          </div>
          <p className="text-gray-600 bengali-text">
            অপেক্ষমান রচনা: <span className="font-bold text-purple-600">{pendingContent.length}টি</span>
          </p>
        </div>

        {/* Content List */}
        {pendingContent.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2 bengali-text">
              সব শেষ হয়ে গেছে!
            </h3>
            <p className="text-gray-500 bengali-text">
              এই মুহূর্তে পর্যালোচনার জন্য কোনো রচনা নেই
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingContent.map((content) => (
              <div key={content.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900 bengali-text">
                        {content.title}
                      </h2>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        অপেক্ষমান
                      </span>
                      {content.category && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full bengali-text">
                          {content.category.name}
                        </span>
                      )}
                    </div>

                    {/* Author Info */}
                    <div className="flex items-center space-x-3 mb-3">
                      {content.author?.profile_picture_url ? (
                        <img 
                          src={content.author.profile_picture_url} 
                          alt={content.author.full_name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 bengali-text">
                          {content.author?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          @{content.author?.username || 'unknown'}
                        </p>
                      </div>
                    </div>

                    {/* Excerpt */}
                    <p className="text-gray-600 mb-4 line-clamp-3 bengali-text leading-relaxed">
                      {content.excerpt || 'বিবরণ নেই'}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span className="bengali-text">{formatDate(content.created_at)}</span>
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded bengali-text">
                        {content.content_type === 'story' ? 'গল্প' : content.content_type === 'poem' ? 'কবিতা' : 'অন্যান্য'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                  <Link
                    href={`/read/${content.slug || content.id}`}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors bengali-text"
                  >
                    <Eye className="w-4 h-4" />
                    <span>পড়ুন</span>
                  </Link>
                  
                  <button
                    onClick={() => handleApprove(content.id)}
                    disabled={processingId === content.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors bengali-text disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === content.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>অনুমোদন</span>
                  </button>

                  <button
                    onClick={() => handleRejectClick(content)}
                    disabled={processingId === content.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors bengali-text disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>প্রত্যাখ্যান</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 bengali-text">
              প্রত্যাখ্যানের কারণ
            </h3>
            <p className="text-gray-600 mb-4 bengali-text">
              "{selectedContent.title}" প্রত্যাখ্যানের কারণ লিখুন
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="লেখককে জানান কেন এই রচনা প্রত্যাখ্যান করা হচ্ছে..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bengali-text h-32 resize-none"
            />
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || processingId === selectedContent.id}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors bengali-text disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === selectedContent.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>প্রত্যাখ্যান করুন</span>
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedContent(null);
                  setRejectionReason('');
                }}
                disabled={processingId === selectedContent.id}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors bengali-text disabled:opacity-50"
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
