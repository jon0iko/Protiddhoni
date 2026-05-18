'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Coins,
  Edit3,
  Loader2,
  Plus,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toBengaliNumber } from '@/lib/numberFormatter';
import type { QuizSummary } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  draft: 'খসড়া',
  published: 'প্রকাশিত',
  archived: 'সংরক্ষিত',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border border-gray-200',
  published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  archived: 'bg-amber-50 text-amber-700 border border-amber-200',
};

export default function AdminQuizListPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !user?.is_admin)) {
      router.push('/');
      return;
    }
    if (isLoggedIn && user?.is_admin) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isLoading, user]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.quizzes.admin.listAll();
      if (res?.success) setQuizzes(res.data || []);
      else setError(res?.error || 'কুইজ লোড করা যায়নি');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'কুইজ লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (quiz: QuizSummary) => {
    if (busyId) return;
    setBusyId(quiz.id);
    try {
      const nextStatus = quiz.status === 'published' ? 'draft' : 'published';
      const res = await api.quizzes.admin.update(quiz.id, { status: nextStatus });
      if (res?.success) {
        setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? { ...q, ...res.data } : q)));
      } else {
        alert(res?.error || 'অবস্থা পরিবর্তন করা যায়নি');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'অবস্থা পরিবর্তন করা যায়নি');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (quiz: QuizSummary) => {
    if (!confirm(`"${quiz.title}" মুছে ফেলবেন? এই অপারেশন পূর্বাবস্থায় ফেরানো যাবে না।`)) return;
    setBusyId(quiz.id);
    try {
      const res = await api.quizzes.admin.remove(quiz.id);
      if (res?.success) setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
      else alert(res?.error || 'মুছে ফেলা যায়নি');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'মুছে ফেলা যায়নি');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading || (loading && !quizzes.length)) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin inline-block" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-sm text-primary-700 bengali-text">
            <Shield className="w-4 h-4" /> অ্যাডমিন প্যানেল
          </div>
          <h1 className="text-3xl font-bold text-gray-900 bengali-text mt-1">কুইজ ব্যবস্থাপনা</h1>
          <p className="text-gray-600 bengali-text mt-1 max-w-2xl">
            পাঠ্য উপাদান লিখুন, Gemini AI মাল্টিপল চয়েস প্রশ্ন তৈরি করবে। প্রকাশিত হলে ব্যবহারকারীরা কড়ি খরচ করে অংশ নিতে পারবে।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/quizzes/new/from-content"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium bengali-text inline-flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> কনটেন্ট থেকে কুইজ
          </Link>
          <Link
            href="/admin/quizzes/new"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium bengali-text inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> ম্যানুয়াল কুইজ
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 bengali-text">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {quizzes.length === 0 ? (
          <div className="py-16 text-center text-gray-500 bengali-text">
            <Brain className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            এখনও কোনো কুইজ তৈরি হয়নি — উপরের &ldquo;নতুন কুইজ&rdquo; বোতাম থেকে শুরু করুন।
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-left">
              <tr className="text-gray-600 bengali-text">
                <th className="px-4 py-3">শিরোনাম</th>
                <th className="px-4 py-3">অবস্থা</th>
                <th className="px-4 py-3 text-right">প্রশ্ন</th>
                <th className="px-4 py-3 text-right">ফি / পুরস্কার</th>
                <th className="px-4 py-3 text-right">ক্রিয়া</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 bengali-text">{quiz.title}</p>
                      {quiz.description && (
                        <p className="text-xs text-gray-500 mt-0.5 bengali-text line-clamp-1">
                          {quiz.description}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {quiz.ai_model && (
                          <span className="text-[11px] text-gray-400 inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {quiz.ai_model}
                          </span>
                        )}
                        {quiz.source_content?.title && (
                          <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 bengali-text">
                            <BookOpen className="w-3 h-3" />
                            {quiz.source_content.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full bengali-text ${STATUS_STYLES[quiz.status]}`}>
                      {STATUS_LABEL[quiz.status] || quiz.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 bengali-text">
                    {toBengaliNumber(quiz.total_questions)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 bengali-text">
                    <span className="inline-flex items-center gap-1 text-yellow-700">
                      <Coins className="w-4 h-4" />
                      {toBengaliNumber(quiz.entry_cost)} / {toBengaliNumber(quiz.reward_per_correct)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(quiz)}
                        disabled={busyId === quiz.id}
                        className="text-xs px-3 py-1.5 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50 bengali-text inline-flex items-center gap-1"
                      >
                        {busyId === quiz.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        {quiz.status === 'published' ? 'অপ্রকাশ' : 'প্রকাশ'}
                      </button>
                      <Link
                        href={`/admin/quizzes/${quiz.id}`}
                        className="text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700 bengali-text inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> সম্পাদনা
                      </Link>
                      <button
                        onClick={() => handleDelete(quiz)}
                        disabled={busyId === quiz.id}
                        className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-1 bengali-text"
                      >
                        <Trash2 className="w-3 h-3" /> মুছে ফেলুন
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
