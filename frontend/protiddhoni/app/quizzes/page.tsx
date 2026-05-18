'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Brain, Coins, Loader2, Plus, Shield, Sparkles, Trophy, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toBengaliNumber } from '@/lib/numberFormatter';
import type { QuizLeaderboardEntry, QuizSummary } from '@/types';

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'সহজ',
  medium: 'মাঝারি',
  hard: 'কঠিন',
};

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  medium: 'bg-primary-50 text-primary-700 border border-primary-200',
  hard: 'bg-accent-50 text-accent-700 border border-accent-200',
};

export default function QuizzesPage() {
  const { isLoggedIn, user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<QuizLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [quizRes, leaderRes] = await Promise.all([
          api.quizzes.listPublished(),
          api.quizzes.globalLeaderboard(10),
        ]);
        if (quizRes?.success) setQuizzes(quizRes.data || []);
        if (leaderRes?.success) setLeaderboard(leaderRes.data || []);
      } catch (err) {
        console.error('Failed to load quizzes:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isLoggedIn]);

  const heroStats = useMemo(() => {
    const totalQuizzes = quizzes.length;
    const totalPlayers = new Set(leaderboard.map((e) => e.user?.id)).size;
    const totalReward = leaderboard.reduce((sum, e) => sum + (Number(e.totalKori) || 0), 0);
    return { totalQuizzes, totalPlayers, totalReward };
  }, [quizzes, leaderboard]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 text-white shadow-xl overflow-hidden">
        <div className="px-6 sm:px-10 py-10 sm:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-sm bengali-text">
              <Sparkles className="w-4 h-4" /> এআই দ্বারা নির্মিত কুইজ
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold bengali-text leading-snug">
              কড়ি বাজি, জ্ঞান যাচাই
            </h1>
            <p className="mt-3 text-white/90 bengali-text">
              অ্যাডমিনদের পাঠ্য থেকে জেমিনি এআই প্রশ্ন তৈরি করে। প্রতিটি কুইজে অংশ নিতে কয়েকটি
              কড়ি খরচ করুন, সঠিক উত্তর দিলে কড়ি জিতুন, এবং বৈশ্বিক লিডারবোর্ডে নিজের অবস্থান গড়ে তুলুন।
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat icon={<Brain className="w-5 h-5" />} label="মোট কুইজ" value={toBengaliNumber(heroStats.totalQuizzes)} />
            <Stat icon={<Users className="w-5 h-5" />} label="খেলোয়াড়" value={toBengaliNumber(heroStats.totalPlayers)} />
            <Stat icon={<Coins className="w-5 h-5" />} label="বিতরিত কড়ি" value={toBengaliNumber(heroStats.totalReward)} />
          </div>
        </div>
      </section>

      {user?.is_admin && (
        <section className="mt-6 rounded-2xl border border-accent-200 bg-accent-50/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="bg-accent-100 text-accent-700 rounded-xl p-2.5">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-accent-800 bengali-text">অ্যাডমিন টুল</p>
              <p className="text-sm text-accent-700/80 bengali-text">
                নতুন পাঠ্য থেকে Gemini AI দিয়ে কুইজ তৈরি করুন বা বিদ্যমান কুইজ পরিচালনা করুন।
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/quizzes/new/from-content"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium bengali-text"
            >
              <BookOpen className="w-4 h-4" /> কনটেন্ট থেকে কুইজ
            </Link>
            <Link
              href="/admin/quizzes/new"
              className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-lg font-medium bengali-text"
            >
              <Plus className="w-4 h-4" /> ম্যানুয়াল কুইজ
            </Link>
            <Link
              href="/admin/quizzes"
              className="inline-flex items-center gap-2 bg-white border border-accent-200 text-accent-700 hover:bg-accent-100 px-4 py-2 rounded-lg font-medium bengali-text"
            >
              <Shield className="w-4 h-4" /> ব্যবস্থাপনা প্যানেল
            </Link>
          </div>
        </section>
      )}

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quiz list */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-gray-900 bengali-text flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary-600" />
              চলমান কুইজ
            </h2>
            <Link
              href="/quizzes/leaderboard"
              className="text-sm text-primary-700 hover:text-primary-800 font-medium bengali-text inline-flex items-center gap-1"
            >
              পূর্ণ লিডারবোর্ড <Trophy className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <Brain className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 bengali-text">এখনও কোনো প্রকাশিত কুইজ নেই। শীঘ্রই দেখুন!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          )}
        </section>

        {/* Mini leaderboard */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-primary-50 px-5 py-4 border-b border-gray-200 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-gray-900 bengali-text">লিডারবোর্ড টপ ১০</h3>
            </div>
            {loading ? (
              <div className="py-10 text-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin inline-block" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-10 text-center text-gray-500 bengali-text px-4">
                প্রথম খেলোয়াড় হয়ে বোর্ডে নাম লেখান!
              </div>
            ) : (
              <ol className="divide-y divide-gray-100">
                {leaderboard.map((entry) => (
                  <li key={entry.user?.id ?? entry.rank} className="px-5 py-3 flex items-center gap-3">
                    <RankBadge rank={entry.rank} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate bengali-text">
                        {entry.user?.full_name || entry.user?.username || 'অজানা'}
                      </p>
                      <p className="text-xs text-gray-500 bengali-text">
                        {toBengaliNumber(entry.gamesPlayed)} টি কুইজ · {toBengaliNumber(entry.totalCorrect)} সঠিক
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-700 bengali-text">{toBengaliNumber(entry.totalScore)}</p>
                      <p className="text-xs text-amber-700 bengali-text flex items-center justify-end gap-1">
                        <Coins className="w-3 h-3" />
                        {toBengaliNumber(Math.round(entry.totalKori))}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
      <div className="flex items-center justify-center mb-1 opacity-90">{icon}</div>
      <div className="text-xl font-bold bengali-text">{value}</div>
      <div className="text-xs text-white/85 bengali-text">{label}</div>
    </div>
  );
}

function QuizCard({ quiz, isLoggedIn }: { quiz: QuizSummary; isLoggedIn: boolean }) {
  const completed = quiz.user_attempt?.status === 'completed';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full bengali-text ${DIFFICULTY_STYLES[quiz.difficulty] || ''}`}>
              {DIFFICULTY_LABEL[quiz.difficulty] || quiz.difficulty}
            </span>
            <span className="text-xs text-gray-500 bengali-text">
              {toBengaliNumber(quiz.total_questions)}টি প্রশ্ন
            </span>
            {quiz.creator?.full_name && (
              <span className="text-xs text-gray-500 bengali-text">· {quiz.creator.full_name}</span>
            )}
          </div>
          <h3 className="mt-2 text-lg font-bold text-gray-900 bengali-text">{quiz.title}</h3>
          {quiz.description && (
            <p className="mt-1 text-sm text-gray-600 bengali-text line-clamp-2">{quiz.description}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center flex-wrap gap-3 justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 px-2 py-1 rounded-full bengali-text">
            <Coins className="w-4 h-4" /> প্রবেশ: {toBengaliNumber(quiz.entry_cost)}
          </span>
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full bengali-text">
            <Sparkles className="w-4 h-4" /> পুরস্কার/সঠিক: {toBengaliNumber(quiz.reward_per_correct)}
          </span>
        </div>

        {completed ? (
          <Link
            href={`/quizzes/${quiz.id}`}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium bengali-text"
          >
            ফলাফল দেখুন ({toBengaliNumber(quiz.user_attempt?.score ?? 0)}/
            {toBengaliNumber(quiz.total_questions)})
          </Link>
        ) : isLoggedIn ? (
          <Link
            href={`/quizzes/${quiz.id}`}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium bengali-text"
          >
            খেলুন
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium bengali-text"
          >
            লগইন করে খেলুন
          </Link>
        )}
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? 'bg-yellow-400 text-white'
      : rank === 2
      ? 'bg-gray-300 text-gray-800'
      : rank === 3
      ? 'bg-amber-600 text-white'
      : 'bg-gray-100 text-gray-700';
  return (
    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bengali-text ${medal}`}>
      {toBengaliNumber(rank)}
    </span>
  );
}
