/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  Loader2,
  CheckCircle,
  XCircle,
  EyeOff,
  RotateCcw,
  ArrowLeft,
  User as UserIcon,
  Calendar,
  FileText,
  Undo2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ActionLog {
  id: string;
  admin_id: string;
  action_type: 'approve' | 'reject' | 'unpublish' | 'republish';
  content_id: string;
  reason: string | null;
  metadata: {
    title?: string;
    slug?: string;
    author_id?: string;
    previous_status?: string;
    was_published?: boolean;
    published_at?: string;
    reverted_unpublish_log_id?: string | null;
  };
  is_reverted: boolean;
  reverted_by: string | null;
  reverted_at: string | null;
  created_at: string;
  admin?: {
    id: string;
    username: string;
    full_name: string;
    profile_picture_url?: string;
  };
  content?: {
    id: string;
    title: string;
    slug: string;
    is_published: boolean;
    status: string;
    author_id: string;
    author?: {
      id: string;
      username: string;
      full_name: string;
    };
  } | null;
  reverted_by_admin?: {
    id: string;
    username: string;
    full_name: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  approve: {
    label: 'অনুমোদিত',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  },
  reject: {
    label: 'প্রত্যাখ্যাত',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle
  },
  unpublish: {
    label: 'অপ্রকাশিত',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: EyeOff
  },
  republish: {
    label: 'পুনঃপ্রকাশিত',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: RotateCcw
  }
};

export default function AdminActionHistoryPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !user?.is_admin)) {
      router.push('/');
      return;
    }

    if (isLoggedIn && user?.is_admin) {
      loadHistory(1);
    }
  }, [isLoggedIn, isLoading, user, router]);

  const loadHistory = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.content.getAdminActionHistory(page, 20);
      if (response.success) {
        setLogs(response.data || []);
        setPagination(response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error loading action history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepublish = async (log: ActionLog) => {
    if (!log.content_id) return;
    if (!confirm('এই রচনাটি পুনরায় প্রকাশ করতে চান?')) return;

    setProcessingId(log.id);
    try {
      const response = await api.content.republish(log.content_id);
      if (response.success) {
        // Reload the history to reflect changes
        await loadHistory(pagination.page);
        alert('রচনাটি পুনরায় প্রকাশিত হয়েছে।');
      }
    } catch (error: any) {
      console.error('Error republishing:', error);
      alert(error.message || 'পুনঃপ্রকাশ করতে সমস্যা হয়েছে।');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = /Z|[+-]\d{2}:\d{2}$/.test(dateString) ? new Date(dateString) : new Date(dateString + 'Z');
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Check if an unpublish action can be reverted
  const canRevert = (log: ActionLog): boolean => {
    return (
      log.action_type === 'unpublish' &&
      !log.is_reverted &&
      log.content !== null &&
      log.content?.status === 'approved' &&
      log.content?.is_published === false
    );
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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/review"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors bengali-text"
          >
            <ArrowLeft className="w-4 h-4" />
            মডারেশন প্যানেলে ফিরুন
          </Link>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 bengali-text">অ্যাডমিন ইতিহাস</h1>
          </div>
          <p className="text-gray-600 bengali-text">
            সমস্ত প্রশাসনিক পদক্ষেপের ইতিহাস — মোট {pagination.total}টি রেকর্ড
          </p>
        </div>

        {/* History List */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2 bengali-text">
              কোনো ইতিহাস নেই
            </h3>
            <p className="text-gray-500 bengali-text">
              এখনো কোনো প্রশাসনিক পদক্ষেপ নেওয়া হয়নি।
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const actionConfig = ACTION_LABELS[log.action_type] || ACTION_LABELS.approve;
              const ActionIcon = actionConfig.icon;
              const contentTitle = log.content?.title || log.metadata?.title || 'অজানা রচনা';
              const authorName = log.content?.author?.full_name || 'অজানা লেখক';

              return (
                <div
                  key={log.id}
                  className={`bg-white rounded-lg border p-5 transition-shadow hover:shadow-sm ${
                    log.is_reverted ? 'border-gray-200 opacity-70' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Action Icon */}
                      <div className={`p-2 rounded-lg flex-shrink-0 ${actionConfig.color}`}>
                        <ActionIcon className="w-4 h-4" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${actionConfig.color} bengali-text`}>
                            {actionConfig.label}
                          </span>
                          {log.is_reverted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 bengali-text">
                              <Undo2 className="w-3 h-3" />
                              পূর্বাবস্থায় ফেরত
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-semibold text-gray-900 truncate bengali-text">
                          {contentTitle}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5" />
                            <span className="bengali-text">লেখক: {authorName}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="bengali-text">অ্যাডমিন: {log.admin?.full_name || log.admin?.username || 'অজানা'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="bengali-text">{formatDate(log.created_at)}</span>
                          </span>
                        </div>

                        {/* Reason */}
                        {log.reason && (
                          <div className="mt-2 p-2.5 bg-gray-50 rounded-md border border-gray-100">
                            <p className="text-sm text-gray-600 bengali-text">
                              <span className="font-medium">কারণ:</span> {log.reason}
                            </p>
                          </div>
                        )}

                        {/* Reverted info */}
                        {log.is_reverted && log.reverted_by_admin && (
                          <p className="mt-2 text-xs text-gray-400 bengali-text">
                            পূর্বাবস্থায় ফেরানো হয়েছে {log.reverted_by_admin.full_name || log.reverted_by_admin.username} দ্বারা
                            {log.reverted_at && ` — ${formatDate(log.reverted_at)}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {log.content && (
                        <Link
                          href={`/read/${log.content.slug || log.content.id}`}
                          target="_blank"
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors bengali-text"
                        >
                          দেখুন
                        </Link>
                      )}
                      {canRevert(log) && (
                        <button
                          onClick={() => handleRepublish(log)}
                          disabled={processingId === log.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 bengali-text"
                        >
                          {processingId === log.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          পুনরায় প্রকাশ করুন
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => loadHistory(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm bengali-text"
            >
              <ChevronLeft className="w-4 h-4" />
              আগের
            </button>
            <span className="text-sm text-gray-600 bengali-text">
              পৃষ্ঠা {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => loadHistory(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm bengali-text"
            >
              পরের
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
