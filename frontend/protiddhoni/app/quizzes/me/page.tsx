'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Coins,
  History,
  Loader2,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toBengaliNumber } from '@/lib/numberFormatter';
import type { QuizAttemptSummary } from '@/types';

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'সহজ',
  medium: 'মাঝারি',
  hard: 'কঠিন',
};

export default function MyQuizHistoryPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/quizzes/me');
    }
  }, [isLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      try {
        const res = await api.quizzes.myAttempts();
        if (res?.success) setAttempts(res.data || []);
        else setError(res?.error || 'ইতিহাস লোড করা যায়নি');
      } catch (err: any) {
        setError(err?.message || 'ইতিহাস লোড করা যায়নি');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isLoggedIn]);

  const stats = useMemo(() => {
    const completed = attempts.filter((a) => a.status === 'completed');
    const totalCorrect = completed.reduce((s, a) => s + (a.correct_answers || 0), 0);
    const totalEarned = completed.reduce((s, a) => s + Number(a.kori_earned || 0), 0);
    const totalSpent = completed.reduce((s, a) => s + Number(a.kori_spent || 0), 0);
    const bestScore = completed.reduce((s, a) => Math.max(s, a.score || 0), 0);
    return {
      played: completed.length,
      totalCorrect,
      totalEarned,
      netKori: totalEarned - totalSpent,
      bestScore,
    };
  }, [attempts]);

  if (isLoading || (loading && isLoggedIn)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin inline-block" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        href="/quizzes"
        className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-medium bengali-text"
      >
        <ArrowLeft className="w-4 h-4" /> কুইজ তালিকায় ফিরুন
      </Link>

      <div className="bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-3">
          <History className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold bengali-text">আমার কুইজ ইতিহাস</h1>
            <p className="text-white/90 bengali-text">
              আপনার সব কুইজের ফলাফল ও কড়ি লেনদেনের পূর্ণ চিত্র।
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat icon={<Brain className="w-4 h-4" />} label="খেলা কুইজ" value={toBengaliNumber(stats.played)} />
          <Stat
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="মোট সঠিক"
            value={toBengaliNumber(stats.totalCorrect)}
          />
          <Stat icon={<Trophy className="w-4 h-4" />} label="সর্বোচ্চ স্কোর" value={toBengaliNumber(stats.bestScore)} />
          <Stat
            icon={<Coins className="w-4 h-4" />}
            label="নেট কড়ি"
            value={`${stats.netKori >= 0 ? '+' : ''}${toBengaliNumber(Math.round(stats.netKori))}`}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 bengali-text">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {attempts.length === 0 ? (
          <div className="py-16 text-center text-gray-500 bengali-text">
            <Sparkles className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            আপনি এখনও কোনো কুইজ খেলেননি।
            <div className="mt-4">
              <Link
                href="/quizzes"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium bengali-text"
              >
                <Brain className="w-4 h-4" /> প্রথম কুইজ খেলুন
              </Link>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-left">
              <tr className="text-gray-600 bengali-text">
                <th className="px-4 py-3">কুইজ</th>
                <th className="px-4 py-3">কঠিনতা</th>
                <th className="px-4 py-3 text-right">স্কোর</th>
                <th className="px-4 py-3 text-right">কড়ি (খরচ → অর্জন)</th>
                <th className="px-4 py-3 text-right">তারিখ</th>
                <th className="px-4 py-3 text-right">ক্রিয়া</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => {
                const completed = attempt.status === 'completed';
                const pct = attempt.total_questions
                  ? Math.round((attempt.correct_answers / attempt.total_questions) * 100)
                  : 0;
                return (
                  <tr key={attempt.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 bengali-text">
                        {attempt.quiz?.title || 'মুছে ফেলা কুইজ'}
                      </p>
                      {!completed && (
                        <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 bengali-text">
                          অসমাপ্ত
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 bengali-text">
                      {attempt.quiz?.difficulty
                        ? DIFFICULTY_LABEL[attempt.quiz.difficulty] || attempt.quiz.difficulty
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-semibold text-primary-700 bengali-text">
                        {toBengaliNumber(attempt.correct_answers)}/{toBengaliNumber(attempt.total_questions)}
                      </p>
                      <p className="text-xs text-gray-500 bengali-text">{toBengaliNumber(pct)}%</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 bengali-text">
                      <span className="text-red-600">-{toBengaliNumber(Math.round(Number(attempt.kori_spent)))}</span>
                      {' → '}
                      <span className="text-emerald-700">
                        +{toBengaliNumber(Math.round(Number(attempt.kori_earned)))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500 bengali-text">
                      {attempt.completed_at
                        ? new Date(attempt.completed_at).toLocaleDateString('bn-BD')
                        : new Date(attempt.started_at).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {attempt.quiz?.id ? (
                        <Link
                          href={`/quizzes/${attempt.quiz.id}`}
                          className="text-xs px-3 py-1.5 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50 bengali-text inline-flex items-center gap-1"
                        >
                          পর্যালোচনা
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400 bengali-text">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/15 rounded-xl p-3 text-center">
      <div className="text-base font-bold bengali-text flex items-center justify-center gap-1">
        {icon}
        {value}
      </div>
      <div className="text-xs text-white/85 bengali-text mt-1">{label}</div>
    </div>
  );
}
