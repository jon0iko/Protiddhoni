/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User as UserIcon,
  AlertCircle,
  History,
  AlertTriangle,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
  category?: { name: string };
}

interface SingleReport {
  id: string;
  reporter_id: string;
  content_id: string;
  reason_category: string;
  reason_details?: string | null;
  created_at: string;
  reporter?: {
    id: string;
    username: string;
    full_name: string;
    profile_picture_url?: string;
  };
}

interface ReportedContentItem extends PendingContent {
  reports: SingleReport[];
}

const REASON_LABELS: Record<string, string> = {
  spam: 'স্প্যাম বা বিজ্ঞাপন',
  inappropriate: 'আপত্তিকর বা অশ্লীল উপাদান',
  copyright: 'কপিরাইট বা চুরিকৃত লেখা',
  hate_speech: 'ঘৃণামূলক বা আক্রমণাত্মক বক্তব্য',
  misinformation: 'ভুল বা বিভ্রান্তিকর তথ্য',
  other: 'অন্যান্য কারণ',
};

const REASON_COLORS: Record<string, string> = {
  spam: 'bg-amber-50 text-amber-800 border-amber-200',
  inappropriate: 'bg-accent-50 text-accent-700 border-accent-200',
  copyright: 'bg-orange-50 text-orange-800 border-orange-200',
  hate_speech: 'bg-red-50 text-red-800 border-red-200',
  misinformation: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function AdminReviewPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'pending' | 'reports'>('pending');
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [reportedContent, setReportedContent] = useState<ReportedContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<PendingContent | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showTakedownModal, setShowTakedownModal] = useState(false);
  const [selectedReportedContent, setSelectedReportedContent] = useState<ReportedContentItem | null>(null);
  const [takedownReason, setTakedownReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !user?.is_admin)) {
      router.push('/');
      return;
    }
    if (isLoggedIn && user?.is_admin) {
      loadAllReviewData();
    }
  }, [isLoggedIn, isLoading, user, router]);

  const loadAllReviewData = async () => {
    setLoading(true);
    await Promise.all([loadPendingContent(), loadReportedContent()]);
    setLoading(false);
  };

  const loadPendingContent = async () => {
    try {
      const response = await api.content.getPending();
      if (response.success) {
        const sorted = (response.data || []).sort(
          (a: PendingContent, b: PendingContent) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setPendingContent(sorted);
      }
    } catch (error) {
      console.error('Error loading pending content:', error);
    }
  };

  const loadReportedContent = async () => {
    try {
      const response = await api.reports.getPending();
      if (response.success) {
        setReportedContent(response.data || []);
      }
    } catch (error) {
      console.error('Error loading reported content:', error);
    }
  };

  const handleApprove = async (contentId: string) => {
    if (!confirm('আপনি কি এই লেখা অনুমোদন করতে চান?')) return;
    setProcessingId(contentId);
    try {
      const response = await api.content.approve(contentId);
      if (response.success) {
        alert('লেখা অনুমোদিত হয়েছে!');
        setPendingContent((prev) => prev.filter((c) => c.id !== contentId));
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
        setPendingContent((prev) => prev.filter((c) => c.id !== selectedContent.id));
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

  const handleTakedownClick = (content: ReportedContentItem) => {
    setSelectedReportedContent(content);
    setTakedownReason('');
    setShowTakedownModal(true);
  };

  const handleTakedownSubmit = async () => {
    if (!selectedReportedContent) return;
    setProcessingId(selectedReportedContent.id);
    try {
      const response = await api.reports.resolve({
        content_id: selectedReportedContent.id,
        action: 'takedown',
        reason: takedownReason.trim() || undefined,
      });
      if (response.success) {
        alert('লেখাটি অপসারণ করা হয়েছে এবং অভিযোগগুলো নিষ্পত্তি করা হয়েছে');
        setReportedContent((prev) => prev.filter((c) => c.id !== selectedReportedContent.id));
        setShowTakedownModal(false);
        setSelectedReportedContent(null);
        setTakedownReason('');
      } else {
        alert(response.error || 'অপসারণে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Error resolving report (takedown):', error);
      alert('অপসারণে সমস্যা হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismissReports = async (contentId: string) => {
    if (!confirm('আপনি কি এই রচনার সমস্ত অভিযোগ খারিজ করতে চান?')) return;
    setProcessingId(contentId);
    try {
      const response = await api.reports.resolve({ content_id: contentId, action: 'dismiss' });
      if (response.success) {
        alert('অভিযোগগুলো খারিজ করা হয়েছে');
        setReportedContent((prev) => prev.filter((c) => c.id !== contentId));
      } else {
        alert(response.error || 'খারিজ করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Error dismissing reports:', error);
      alert('খারিজ করতে সমস্যা হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpandReports = (contentId: string) => {
    setExpandedReports((prev) => {
      const next = new Set(prev);
      if (next.has(contentId)) next.delete(contentId);
      else next.add(contentId);
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = /Z|[+-]\d{2}:\d{2}$/.test(dateString)
      ? new Date(dateString)
      : new Date(dateString + 'Z');
    return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const AuthorAvatar = ({ author }: { author?: PendingContent['author'] }) =>
    author?.profile_picture_url ? (
      <img
        src={author.profile_picture_url}
        alt={author.full_name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    ) : (
      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-600 rounded-full flex items-center justify-center flex-shrink-0">
        <UserIcon className="w-4 h-4 text-white" />
      </div>
    );

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="p-2 bg-primary-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 bengali-text">মডারেশন প্যানেল</h1>
            </div>
            <p className="text-sm text-gray-500 bengali-text ml-12">
              অপেক্ষমান:{' '}
              <span className="font-semibold text-gray-700">{pendingContent.length}টি</span>
              {'  ·  '}
              অভিযোগ:{' '}
              <span className="font-semibold text-accent-600">{reportedContent.length}টি</span>
            </p>
          </div>
          <Link
            href="/admin/review/history"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm bengali-text shadow-sm"
          >
            <History className="w-4 h-4" />
            ইতিহাস
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-semibold bengali-text border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            অপেক্ষমান রচনা
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-sans ${
                activeTab === 'pending'
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {pendingContent.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-sm font-semibold bengali-text border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'border-accent-600 text-accent-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            অভিযোগ
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-sans ${
                activeTab === 'reports'
                  ? 'bg-accent-100 text-accent-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {reportedContent.length}
            </span>
          </button>
        </div>

        {/* ─── Tab 1: Pending Content ─── */}
        {activeTab === 'pending' && (
          pendingContent.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1 bengali-text">সব শেষ!</h3>
              <p className="text-sm text-gray-400 bengali-text">এই মুহূর্তে পর্যালোচনার জন্য কোনো রচনা নেই</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingContent.map((content) => (
                <div
                  key={content.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h2 className="text-lg font-bold text-gray-900 bengali-text">{content.title}</h2>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded border border-amber-200 bengali-text">
                          অপেক্ষমান
                        </span>
                        {content.category && (
                          <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded border border-primary-200 bengali-text">
                            {content.category.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 bengali-text">
                          {content.content_type === 'story' ? 'গল্প' : content.content_type === 'poem' ? 'কবিতা' : 'অন্যান্য'}
                        </span>
                      </div>

                      {/* Author + Date */}
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <AuthorAvatar author={content.author} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 bengali-text leading-none mb-0.5">
                            {content.author?.full_name || 'অজানা'}
                          </p>
                          <p className="text-xs text-gray-400">@{content.author?.username || 'unknown'}</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-gray-400 ml-2 bengali-text">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(content.created_at)}
                        </span>
                      </div>

                      {/* Excerpt */}
                      {content.excerpt && (
                        <p className="text-sm text-gray-600 bengali-text line-clamp-2 leading-relaxed">
                          {content.excerpt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3.5 border-t border-gray-100">
                    <Link
                      href={`/read/${content.slug || content.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm bengali-text"
                    >
                      <Eye className="w-3.5 h-3.5" /> পড়ুন
                    </Link>
                    <button
                      onClick={() => handleApprove(content.id)}
                      disabled={processingId === content.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm bengali-text disabled:opacity-50"
                    >
                      {processingId === content.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      অনুমোদন
                    </button>
                    <button
                      onClick={() => handleRejectClick(content)}
                      disabled={processingId === content.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors text-sm bengali-text disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> প্রত্যাখ্যান
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ─── Tab 2: Reported Content ─── */}
        {activeTab === 'reports' && (
          reportedContent.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1 bengali-text">কোনো অভিযোগ নেই</h3>
              <p className="text-sm text-gray-400 bengali-text">
                এই মুহূর্তে কোনো লেখার বিরুদ্ধে রিপোর্ট জমা নেই
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportedContent.map((content) => {
                const isExpanded = expandedReports.has(content.id);
                return (
                  <div
                    key={content.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
                  >
                    {/* Thin accent top-bar */}
                    <div className="h-0.5 bg-gradient-to-r from-accent-500 to-accent-300" />

                    <div className="p-5">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h2 className="text-lg font-bold text-gray-900 bengali-text">{content.title}</h2>
                            {/* Report count badge */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-50 text-accent-700 text-xs font-semibold rounded border border-accent-200 bengali-text">
                              <AlertTriangle className="w-3 h-3" />
                              {content.reports?.length || 0}টি অভিযোগ
                            </span>
                            {content.category && (
                              <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded border border-primary-200 bengali-text">
                                {content.category.name}
                              </span>
                            )}
                          </div>

                          {/* Author + Date */}
                          <div className="flex items-center gap-2.5 mb-2.5">
                            <AuthorAvatar author={content.author} />
                            <div>
                              <p className="text-sm font-medium text-gray-900 bengali-text leading-none mb-0.5">
                                {content.author?.full_name || 'অজানা'}
                              </p>
                              <p className="text-xs text-gray-400">@{content.author?.username || 'unknown'}</p>
                            </div>
                          </div>

                          {/* Excerpt */}
                          {content.excerpt && (
                            <p className="text-sm text-gray-600 bengali-text line-clamp-2 leading-relaxed">
                              {content.excerpt}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Expandable Reports list */}
                      <div className="mb-4">
                        <button
                          onClick={() => toggleExpandReports(content.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors bengali-text"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" /> অভিযোগের বিবরণ লুকান
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" /> অভিযোগের বিবরণ দেখুন ({content.reports?.length || 0}টি)
                            </>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 border border-gray-100 rounded-lg divide-y divide-gray-100 overflow-hidden">
                            {content.reports?.map((report) => (
                              <div key={report.id} className="p-3 bg-gray-50">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    {report.reporter?.profile_picture_url ? (
                                      <img
                                        src={report.reporter.profile_picture_url}
                                        alt=""
                                        className="w-5 h-5 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex-shrink-0" />
                                    )}
                                    <span className="text-xs font-medium text-gray-700 bengali-text">
                                      {report.reporter?.full_name || report.reporter?.username || 'ব্যবহারকারী'}
                                    </span>
                                    <span className="text-xs text-gray-400 bengali-text">
                                      {formatDate(report.created_at)}
                                    </span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded border bengali-text ${
                                      REASON_COLORS[report.reason_category] || REASON_COLORS.other
                                    }`}
                                  >
                                    {REASON_LABELS[report.reason_category] || report.reason_category}
                                  </span>
                                </div>
                                {report.reason_details && (
                                  <p className="text-xs text-gray-500 bengali-text pl-7 leading-relaxed">
                                    {report.reason_details}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3.5 border-t border-gray-100">
                        <Link
                          href={`/read/${content.slug || content.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm bengali-text"
                        >
                          <Eye className="w-3.5 h-3.5" /> লেখাটি পড়ুন
                        </Link>
                        <button
                          onClick={() => handleTakedownClick(content)}
                          disabled={processingId === content.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors text-sm bengali-text disabled:opacity-50"
                        >
                          {processingId === content.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                          অপসারণ করুন
                        </button>
                        <button
                          onClick={() => handleDismissReports(content.id)}
                          disabled={processingId === content.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm bengali-text disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          অভিযোগ খারিজ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ─── Reject Modal ─── */}
      {showRejectModal && selectedContent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-5 h-5 text-accent-600" />
              <h3 className="text-lg font-bold text-gray-900 bengali-text">প্রত্যাখ্যানের কারণ</h3>
            </div>
            <p className="text-sm text-gray-500 bengali-text mb-4">
              &ldquo;{selectedContent.title}&rdquo; প্রত্যাখ্যানের কারণ লিখুন
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="লেখককে জানান কেন এই রচনা প্রত্যাখ্যান করা হচ্ছে..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bengali-text h-28 resize-none text-sm text-gray-900"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || processingId === selectedContent.id}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors text-sm bengali-text disabled:opacity-50"
              >
                {processingId === selectedContent.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                প্রত্যাখ্যান করুন
              </button>
              <button
                onClick={() => { setShowRejectModal(false); setSelectedContent(null); setRejectionReason(''); }}
                disabled={processingId === selectedContent.id}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm bengali-text disabled:opacity-50"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Takedown Modal ─── */}
      {showTakedownModal && selectedReportedContent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <EyeOff className="w-5 h-5 text-accent-600" />
              <h3 className="text-lg font-bold text-gray-900 bengali-text">রচনা অপসারণ</h3>
            </div>
            <p className="text-sm text-gray-500 bengali-text mb-1">
              &ldquo;{selectedReportedContent.title}&rdquo; অপ্রকাশিত করতে চান?
            </p>
            <p className="text-xs text-gray-400 bengali-text mb-4">
              লেখাটি পাঠকদের কাছ থেকে লুকানো হবে এবং লেখককে একটি নোটিফিকেশন পাঠানো হবে। পরে ইতিহাস থেকে পুনঃপ্রকাশ করা যাবে।
            </p>
            <textarea
              value={takedownReason}
              onChange={(e) => setTakedownReason(e.target.value)}
              placeholder="অপসারণের কারণ (ঐচ্ছিক)..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent bengali-text h-24 resize-none text-sm text-gray-900"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleTakedownSubmit}
                disabled={processingId === selectedReportedContent.id}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors text-sm bengali-text disabled:opacity-50"
              >
                {processingId === selectedReportedContent.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                অপসারণ নিশ্চিত করুন
              </button>
              <button
                onClick={() => { setShowTakedownModal(false); setSelectedReportedContent(null); setTakedownReason(''); }}
                disabled={processingId === selectedReportedContent.id}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm bengali-text disabled:opacity-50"
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
