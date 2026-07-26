/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  FilePlus2,
  PencilLine,
  ArrowLeft,
  User as UserIcon,
  Calendar,
  Clock,
  History,
  Inbox,
  Eye
} from 'lucide-react';
import type { AdminActionLogEntry, ContentEditSnapshot } from '@/types';

type QueueKind = 'submission' | 'edit';
type FilterKey = 'all' | QueueKind;

interface QueueItem {
  id: string;
  kind: QueueKind;
  timestamp: string;
  title: string;
  author: string;
  href: string | null;
  contentId: string;
  logId?: string;
  before?: ContentEditSnapshot;
  after?: ContentEditSnapshot;
}

const KIND_LABELS: Record<QueueKind, { label: string; color: string; icon: any }> = {
  submission: {
    label: 'নতুন জমা',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: FilePlus2
  },
  edit: {
    label: 'প্রকাশিত লেখায় সম্পাদনা',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: PencilLine
  }
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'সব' },
  { key: 'submission', label: 'নতুন জমা' },
  { key: 'edit', label: 'সম্পাদনা' }
];

// How many of each kind we pull. The two work-item kinds live in different
// tables, so instead of building interleaved cross-table pagination we take the
// most recent N of each and merge them in memory.
const FETCH_LIMIT = 50;

export default function AdminModerationQueuePage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject modal state (same pattern as the pending-review page)
  const [rejectTarget, setRejectTarget] = useState<QueueItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !user?.is_admin)) {
      router.push('/');
      return;
    }

    if (isLoggedIn && user?.is_admin) {
      loadQueue();
    }
  }, [isLoggedIn, isLoading, user, router]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const [pendingRes, editRes] = await Promise.all([
        api.content.getPending(),
        api.content.getEditQueue(1, FETCH_LIMIT, 'unchecked')
      ]);

      const submissions: QueueItem[] = (pendingRes?.success ? pendingRes.data || [] : []).map(
        (content: any) => ({
          id: `submission:${content.id}`,
          kind: 'submission' as const,
          timestamp: content.updated_at || content.created_at,
          title: content.title || 'অজানা রচনা',
          author: content.author?.full_name || content.author?.username || 'অজানা লেখক',
          href: content.slug || content.id ? `/read/${content.slug || content.id}` : null,
          contentId: content.id
        })
      );

      const edits: QueueItem[] = (editRes?.success ? editRes.data || [] : []).map(
        (log: AdminActionLogEntry) => ({
          id: `edit:${log.id}`,
          kind: 'edit' as const,
          timestamp: log.created_at,
          title: log.content?.title || log.metadata?.after?.title || log.metadata?.title || 'অজানা রচনা',
          // An edit row has no admin actor — the actor is the author.
          author:
            log.content?.author?.full_name ||
            log.content?.author?.username ||
            'অজানা লেখক',
          href: log.content ? `/read/${log.content.slug || log.content.id}` : null,
          contentId: log.content_id,
          logId: log.id,
          before: log.metadata?.before,
          after: log.metadata?.after
        })
      );

      const merged = [...submissions, ...edits].sort(
        (a, b) => new Date(withUtc(b.timestamp)).getTime() - new Date(withUtc(a.timestamp)).getTime()
      );

      setItems(merged);
    } catch (error) {
      console.error('Error loading moderation queue:', error);
    } finally {
      setLoading(false);
    }
  };

  // Supabase hands back timestamps without a trailing Z. Parsing those as-is
  // makes the browser read them as local time and silently shifts every value
  // by the viewer's UTC offset.
  const withUtc = (dateString: string) =>
    /Z|[+-]\d{2}:\d{2}$/.test(dateString) ? dateString : dateString + 'Z';

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

  const toBengaliDigits = (value: number) =>
    String(value).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

  const formatRelative = (dateString: string) => {
    if (!dateString) return '';
    const then = new Date(withUtc(dateString)).getTime();
    if (Number.isNaN(then)) return '';

    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (seconds < 60) return 'এইমাত্র';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${toBengaliDigits(minutes)} মিনিট আগে`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${toBengaliDigits(hours)} ঘন্টা আগে`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${toBengaliDigits(days)} দিন আগে`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${toBengaliDigits(months)} মাস আগে`;

    return `${toBengaliDigits(Math.floor(months / 12))} বছর আগে`;
  };

  const handleApprove = async (item: QueueItem) => {
    if (!confirm('এই রচনাটি অনুমোদন করতে চান?')) return;

    setProcessingId(item.id);
    try {
      const response = await api.content.approve(item.contentId);
      if (response.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    } catch (error: any) {
      console.error('Error approving:', error);
      alert(error.message || 'অনুমোদন করতে সমস্যা হয়েছে।');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      alert('প্রত্যাখ্যানের কারণ লিখুন।');
      return;
    }

    const target = rejectTarget;
    setProcessingId(target.id);
    try {
      const response = await api.content.reject(target.contentId, rejectReason.trim());
      if (response.success) {
        setItems((prev) => prev.filter((i) => i.id !== target.id));
        setRejectTarget(null);
        setRejectReason('');
      }
    } catch (error: any) {
      console.error('Error rejecting:', error);
      alert(error.message || 'প্রত্যাখ্যান করতে সমস্যা হয়েছে।');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkChecked = async (item: QueueItem) => {
    if (!item.logId) return;

    setProcessingId(item.id);
    try {
      const response = await api.content.markActionChecked(item.logId);
      if (response.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    } catch (error: any) {
      console.error('Error marking checked:', error);
      alert(error.message || 'চিহ্নিত করতে সমস্যা হয়েছে।');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredItems = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.kind === filter)),
    [items, filter]
  );

  const counts = useMemo(
    () => ({
      all: items.length,
      submission: items.filter((i) => i.kind === 'submission').length,
      edit: items.filter((i) => i.kind === 'edit').length
    }),
    [items]
  );

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

          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Inbox className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 bengali-text">মডারেশন কিউ</h1>
            </div>
            <Link
              href="/admin/review/history"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bengali-text"
            >
              <History className="w-4 h-4" />
              অ্যাডমিন ইতিহাস
            </Link>
          </div>

          <p className="text-gray-600 bengali-text">
            নতুন জমা এবং প্রকাশিত লেখার সম্পাদনা — একসাথে, সময় অনুযায়ী সাজানো। মোট{' '}
            {counts.all}টি কাজ বাকি।
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-6">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors bengali-text ${
                  filter === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{label}</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                  {counts[key]}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Queue */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2 bengali-text">
              কিউ খালি
            </h3>
            <p className="text-gray-500 bengali-text">
              এই মুহূর্তে পর্যালোচনার জন্য কিছু নেই।
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const kindConfig = KIND_LABELS[item.kind];
              const KindIcon = kindConfig.icon;
              const busy = processingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-gray-200 p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${kindConfig.color}`}>
                        <KindIcon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${kindConfig.color} bengali-text`}
                          >
                            {kindConfig.label}
                          </span>
                        </div>

                        <h4 className="text-base font-semibold text-gray-900 truncate bengali-text">
                          {item.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5" />
                            <span className="bengali-text">লেখক: {item.author}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="bengali-text">{formatDate(item.timestamp)}</span>
                          </span>
                          <span className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="bengali-text">{formatRelative(item.timestamp)}</span>
                          </span>
                        </div>

                        {/* Edit diff summary */}
                        {item.kind === 'edit' && (item.before || item.after) && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="p-2.5 bg-gray-50 rounded-md border border-gray-100">
                              <p className="text-xs font-medium text-gray-500 mb-1 bengali-text">
                                আগে ({toBengaliDigits(item.before?.body_length ?? 0)} অক্ষর)
                              </p>
                              <p className="text-sm text-gray-700 bengali-text line-clamp-3">
                                {item.before?.title || '—'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                                {item.before?.body_preview || ''}
                              </p>
                            </div>
                            <div className="p-2.5 bg-purple-50 rounded-md border border-purple-100">
                              <p className="text-xs font-medium text-purple-600 mb-1 bengali-text">
                                পরে ({toBengaliDigits(item.after?.body_length ?? 0)} অক্ষর)
                              </p>
                              <p className="text-sm text-gray-700 bengali-text line-clamp-3">
                                {item.after?.title || '—'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                                {item.after?.body_preview || ''}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.href && (
                        <Link
                          href={item.href}
                          target="_blank"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors bengali-text"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          দেখুন
                        </Link>
                      )}

                      {item.kind === 'submission' && (
                        <>
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 bengali-text"
                          >
                            {busy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            অনুমোদন
                          </button>
                          <button
                            onClick={() => {
                              setRejectTarget(item);
                              setRejectReason('');
                            }}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 bengali-text"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            প্রত্যাখ্যান
                          </button>
                        </>
                      )}

                      {item.kind === 'edit' && (
                        <button
                          onClick={() => handleMarkChecked(item)}
                          disabled={busy}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 bengali-text"
                        >
                          {busy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          পরীক্ষিত চিহ্নিত করুন
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400 text-center bengali-text">
          প্রতিটি ধরনের সাম্প্রতিক {toBengaliDigits(FETCH_LIMIT)}টি আইটেম দেখানো হচ্ছে। পুরনো
          রেকর্ডের জন্য{' '}
          <Link href="/admin/review/history" className="underline hover:text-gray-600">
            অ্যাডমিন ইতিহাস
          </Link>{' '}
          দেখুন।
        </p>
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 bengali-text">
              রচনা প্রত্যাখ্যান
            </h3>
            <p className="text-sm text-gray-600 mb-4 bengali-text truncate">
              {rejectTarget.title}
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 bengali-text">
              কারণ (আবশ্যক)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bengali-text"
              placeholder="লেখককে জানান কেন এই রচনাটি প্রত্যাখ্যান করা হচ্ছে..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors bengali-text"
              >
                বাতিল
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || processingId === rejectTarget.id}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 bengali-text"
              >
                {processingId === rejectTarget.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                প্রত্যাখ্যান করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
