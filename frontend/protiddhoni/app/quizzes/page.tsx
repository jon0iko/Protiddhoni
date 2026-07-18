/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  Coins,
  GraduationCap,
  Loader2,
  Plus,
  Shield,
  Sparkles,
  Timer,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toBengaliNumber } from '@/lib/numberFormatter';
import type { QuizLeaderboardEntry, QuizSummary, RoundPhase } from '@/types';
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_STYLES,
  PHASE_LABEL,
  PHASE_STYLES,
  formatCountdown,
  formatDateTime,
  msUntil,
} from './_lib/round';

type TypeTab = 'all' | 'general' | 'exam';

export default function QuizzesPage() {
  const { isLoggedIn, user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<QuizLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TypeTab>('all');
  const [examCategory, setExamCategory] = useState<string>('all');

  // One ticker drives every countdown on the page.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const handle = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

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

  const examCategories = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.quiz_type === 'exam' && q.exam_category) set.add(q.exam_category);
    });
    return Array.from(set).sort();
  }, [quizzes]);

  const visibleQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      if (tab !== 'all' && quiz.quiz_type !== tab) return false;
      if (tab === 'exam' && examCategory !== 'all' && quiz.exam_category !== examCategory) {
        return false;
      }
      return true;
    });
  }, [quizzes, tab, examCategory]);

  const heroStats = useMemo(() => {
    const liveRounds = quizzes.filter((q) => q.phase === 'open').length;
    const totalPool = quizzes
      .filter((q) => q.phase === 'open' || q.phase === 'scheduled')
      .reduce((sum, q) => sum + (Number(q.prize_pool) || 0), 0);
    const totalPlayers = quizzes.reduce((sum, q) => sum + (Number(q.players_joined) || 0), 0);
    return { liveRounds, totalPool, totalPlayers };
  }, [quizzes]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 text-white shadow-xl overflow-hidden">
        <div className="px-6 sm:px-10 py-10 sm:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-sm bengali-text">
              <Sparkles className="w-4 h-4" /> নির্ধারিত সময়ের প্রতিযোগিতামূলক রাউন্ড
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold bengali-text leading-snug">
              কড়ি বাজি, জ্ঞান যাচাই
            </h1>
            <p className="mt-3 text-white/90 bengali-text">
              প্রতিটি রাউন্ডে প্রবেশ ফি জমা হয় একটাই পুরস্কার তহবিলে। রাউন্ড শেষ হলে সেরা তিনজন
              তহবিলের ৫০/৩০/২০ ভাগ পেয়ে যান — স্বয়ংক্রিয়ভাবে, সরাসরি ওয়ালেটে।
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat icon={<Brain className="w-5 h-5" />} label="চলমান রাউন্ড" value={toBengaliNumber(heroStats.liveRounds)} />
            <Stat icon={<Users className="w-5 h-5" />} label="অংশগ্রহণকারী" value={toBengaliNumber(heroStats.totalPlayers)} />
            <Stat icon={<Coins className="w-5 h-5" />} label="মোট তহবিল" value={toBengaliNumber(Math.round(heroStats.totalPool))} />
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
                নতুন রাউন্ড নির্ধারণ করুন, প্রশ্ন সাজান, এবং পুরস্কার তহবিল পরিচালনা করুন।
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/quizzes/new"
              className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-lg font-medium bengali-text"
            >
              <Plus className="w-4 h-4" /> নতুন রাউন্ড
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

      {/* Global leaderboard — display only, sits above the rounds */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 bengali-text flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            বৈশ্বিক লিডারবোর্ড
          </h2>
          <Link
            href="/quizzes/leaderboard"
            className="text-sm text-primary-700 hover:text-primary-800 font-medium bengali-text"
          >
            পূর্ণ তালিকা →
          </Link>
        </div>
        <GlobalLeaderboardPanel entries={leaderboard} loading={loading} currentUserId={user?.id} />
      </section>

      {/* Rounds */}
      <section className="mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h2 className="text-2xl font-bold text-gray-900 bengali-text flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary-600" />
            চলমান কুইজ
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <TypeTabButton active={tab === 'all'} onClick={() => setTab('all')} label="সব" />
            <TypeTabButton active={tab === 'general'} onClick={() => setTab('general')} label="সাধারণ" />
            <TypeTabButton
              active={tab === 'exam'}
              onClick={() => setTab('exam')}
              label="পরীক্ষা"
              icon={<GraduationCap className="w-3.5 h-3.5" />}
            />
            {tab === 'exam' && (
              <select
                value={examCategory}
                onChange={(e) => setExamCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bengali-text focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">সব বিভাগ</option>
                {examCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : visibleQuizzes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <Brain className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 bengali-text">
              এই ফিল্টারে কোনো রাউন্ড নেই। শীঘ্রই আবার দেখুন!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} isLoggedIn={isLoggedIn} nowMs={nowMs} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TypeTabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium bengali-text inline-flex items-center gap-1.5 border transition-colors ${
        active
          ? 'bg-primary-600 border-primary-600 text-white'
          : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
      }`}
    >
      {icon}
      {label}
    </button>
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

function QuizCard({
  quiz,
  isLoggedIn,
  nowMs,
}: {
  quiz: QuizSummary;
  isLoggedIn: boolean;
  nowMs: number;
}) {
  const phase: RoundPhase = quiz.phase || 'open';
  const entered = Boolean(quiz.user_attempt);
  const completed = quiz.user_attempt?.status === 'completed';

  // Before the round opens we count down to the open; after that, to the close.
  const countdownTarget = phase === 'scheduled' ? quiz.opens_at : quiz.closes_at;
  const countdownLabel = phase === 'scheduled' ? 'শুরু হবে' : 'শেষ হবে';
  const remaining = msUntil(countdownTarget, nowMs);
  const urgent = remaining != null && remaining > 0 && remaining < 5 * 60 * 1000;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full bengali-text ${PHASE_STYLES[phase]}`}>
          {PHASE_LABEL[phase]}
        </span>
        {quiz.quiz_type === 'exam' ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            {quiz.exam_category || 'পরীক্ষা'}
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 bengali-text">
            সাধারণ
          </span>
        )}
        <span
          className={`text-xs px-2 py-0.5 rounded-full bengali-text ${
            DIFFICULTY_STYLES[quiz.difficulty] || ''
          }`}
        >
          {DIFFICULTY_LABEL[quiz.difficulty] || quiz.difficulty}
        </span>
        <span className="text-xs text-gray-500 bengali-text">
          {toBengaliNumber(quiz.total_questions)}টি প্রশ্ন
        </span>
      </div>

      <h3 className="mt-2.5 text-lg font-bold text-gray-900 bengali-text">{quiz.title}</h3>
      {quiz.description && (
        <p className="mt-1 text-sm text-gray-600 bengali-text line-clamp-2">{quiz.description}</p>
      )}

      {/* Prize pool is the headline number on the card */}
      <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-4 py-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-amber-700 bengali-text">
            পুরস্কার তহবিল
          </p>
          <p className="text-3xl font-extrabold text-amber-800 bengali-text leading-tight flex items-center gap-1.5">
            <Coins className="w-6 h-6" />
            {toBengaliNumber(Math.round(Number(quiz.prize_pool) || 0))}
          </p>
        </div>
        <div className="text-right text-xs text-amber-800/80 bengali-text">
          <p>সেরা ৩ জন</p>
          <p className="font-semibold">৫০ / ৩০ / ২০</p>
        </div>
      </div>

      <div className="mt-3 flex items-center flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 px-2 py-1 rounded-full bengali-text">
          <Coins className="w-3.5 h-3.5" /> প্রবেশ {toBengaliNumber(quiz.entry_cost)}
        </span>
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full bengali-text">
          <Users className="w-3.5 h-3.5" /> {toBengaliNumber(quiz.players_joined ?? 0)} জন যোগ দিয়েছেন
        </span>
        {phase !== 'settled' && countdownTarget && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bengali-text ${
              urgent ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-gray-100 text-gray-700'
            }`}
            title={formatDateTime(countdownTarget)}
          >
            <Timer className="w-3.5 h-3.5" /> {countdownLabel} {formatCountdown(remaining)}
          </span>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500 bengali-text">
          {entered
            ? completed
              ? 'আপনি খেলে ফেলেছেন'
              : 'আপনি যোগ দিয়েছেন'
            : phase === 'open'
            ? 'প্রবেশ খোলা আছে'
            : ''}
        </span>
        {!isLoggedIn ? (
          <Link
            href="/login"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium bengali-text text-sm"
          >
            লগইন করে খেলুন
          </Link>
        ) : (
          <Link
            href={`/quizzes/${quiz.id}`}
            className={`px-4 py-2 rounded-lg font-medium bengali-text text-sm ${
              phase === 'open' && !completed
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {completed
              ? 'ফলাফল দেখুন'
              : entered
              ? 'রুমে ফিরুন'
              : phase === 'open'
              ? 'যোগ দিন'
              : 'বিস্তারিত'}
          </Link>
        )}
      </div>
    </div>
  );
}

function GlobalLeaderboardPanel({
  entries,
  loading,
  currentUserId,
}: {
  entries: QuizLeaderboardEntry[];
  loading: boolean;
  currentUserId?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {loading ? (
        <div className="py-10 text-center text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin inline-block" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-10 text-center text-gray-500 bengali-text px-4">
          প্রথম খেলোয়াড় হয়ে বোর্ডে নাম লেখান!
        </div>
      ) : (
        <ol className="divide-y divide-gray-100 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-x-6 sm:px-2">
          {entries.map((entry) => {
            const isMe = entry.user?.id === currentUserId;
            return (
              <li
                key={entry.user?.id ?? entry.rank}
                className={`px-5 py-3 flex items-center gap-3 sm:border-b sm:border-gray-100 ${
                  isMe ? 'bg-primary-50/60' : ''
                }`}
              >
                <RankBadge rank={entry.rank} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate bengali-text">
                    {entry.user?.full_name || entry.user?.username || 'অজানা'}
                    {isMe && (
                      <span className="ml-2 text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded bengali-text">
                        আপনি
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 bengali-text">
                    {toBengaliNumber(entry.gamesPlayed)} টি রাউন্ড · {toBengaliNumber(entry.totalCorrect)} সঠিক
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-700 bengali-text">
                    {toBengaliNumber(entry.totalScore)}
                  </p>
                  <p className="text-xs text-amber-700 bengali-text flex items-center justify-end gap-1">
                    <Coins className="w-3 h-3" />
                    {toBengaliNumber(Math.round(entry.totalKori))}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
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
    <span
      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm bengali-text ${medal}`}
    >
      {toBengaliNumber(rank)}
    </span>
  );
}
