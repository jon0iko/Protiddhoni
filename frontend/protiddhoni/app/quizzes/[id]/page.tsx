'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Coins,
  Loader2,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toBengaliNumber } from '@/lib/numberFormatter';
import type {
  QuizQuestionPlayable,
  QuizReviewItem,
  QuizSourceContent,
  QuizSpecificLeaderboardEntry,
} from '@/types';

type QuizPreview = {
  id: string;
  title: string;
  description?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  entry_cost: number;
  reward_per_correct: number;
  total_questions: number;
  time_limit_seconds?: number | null;
  creator?: { id: string; username: string; full_name: string } | null;
  source_content?: QuizSourceContent | null;
  published_at?: string | null;
};

type AttemptInfo = {
  id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  score: number;
  correct_answers: number;
  kori_spent: number;
  kori_earned: number;
  completed_at?: string | null;
};

type SubmissionResult = {
  attempt: AttemptInfo;
  correct_answers: number;
  total_questions: number;
  kori_earned: number;
  balance_after: number | null;
  review: QuizReviewItem[];
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'সহজ',
  medium: 'মাঝারি',
  hard: 'কঠিন',
};

export default function PlayQuizPage() {
  const params = useParams<{ id: string }>();
  const quizId = params?.id;
  const router = useRouter();
  const { user, isLoggedIn, refreshBalance } = useAuth();

  const [preview, setPreview] = useState<QuizPreview | null>(null);
  const [existingAttempt, setExistingAttempt] = useState<AttemptInfo | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionPlayable[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'lobby' | 'playing' | 'result'>('lobby');
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [reviewFromHistory, setReviewFromHistory] = useState<QuizReviewItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.quizzes.getPreview(quizId);
        if (!res?.success) {
          setError(res?.error || 'কুইজ লোড করা যায়নি');
          return;
        }
        setPreview(res.data.quiz);
        setExistingAttempt(res.data.user_attempt || null);

        if (res.data.user_attempt?.status === 'completed') {
          try {
            const attemptRes = await api.quizzes.getAttempt(res.data.user_attempt.id);
            if (attemptRes?.success) {
              setReviewFromHistory(attemptRes.data.review || []);
              setPhase('result');
            }
          } catch (err) {
            console.warn('Failed to load attempt history:', err);
          }
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'কুইজ লোড করা যায়নি');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId]);

  const handleStart = async () => {
    if (!quizId) return;
    if (!isLoggedIn) {
      router.push(`/login?redirect=/quizzes/${quizId}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.quizzes.start(quizId);
      if (!res?.success) {
        setError(res?.error || 'কুইজ শুরু করা যায়নি');
        return;
      }
      setAttemptId(res.data.attempt_id);
      setQuestions(res.data.questions || []);
      setAnswers({});
      setCurrentIndex(0);
      setPhase('playing');
      startedAtRef.current = Date.now();
      const limit = Number(res.data?.quiz?.time_limit_seconds) || null;
      setTimeLimitSeconds(limit);
      setRemainingSeconds(limit);
      setExpired(false);
      await refreshBalance();
    } catch (err: any) {
      const status = err?.status;
      const message = err?.response?.data?.error || err?.message || 'কুইজ শুরু করা যায়নি';
      if (status === 402) setError('পর্যাপ্ত কড়ি নেই — ওয়ালেটে কড়ি যোগ করুন।');
      else setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleSelect = (questionId: string, index: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: index }));
  };

  // Countdown ticker — only runs while playing with a configured limit.
  useEffect(() => {
    if (phase !== 'playing' || !timeLimitSeconds || startedAtRef.current == null) {
      return;
    }
    const tick = () => {
      const elapsedSec = Math.floor((Date.now() - (startedAtRef.current ?? Date.now())) / 1000);
      const remaining = Math.max(0, timeLimitSeconds - elapsedSec);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setExpired(true);
        // Auto-submit whatever has been answered so the server can finalize.
        handleSubmit({ auto: true });
      }
    };
    tick();
    const handle = window.setInterval(tick, 1000);
    return () => window.clearInterval(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLimitSeconds]);

  const handleSubmit = async (opts?: { auto?: boolean }) => {
    if (!attemptId) return;
    const isAuto = Boolean(opts?.auto);
    if (!isAuto && Object.keys(answers).length !== questions.length) {
      setError('সব প্রশ্নের উত্তর দিন');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const duration = startedAtRef.current ? Date.now() - startedAtRef.current : undefined;
      // On auto-submit (timer expired), only send the questions that were
      // actually answered. The server will treat all unanswered as wrong.
      const answeredQuestions = questions.filter((q) => answers[q.id] !== undefined);
      const payload = {
        answers: (isAuto ? answeredQuestions : questions).map((q) => ({
          question_id: q.id,
          selected_index: answers[q.id],
        })),
        duration_ms: duration,
      };
      const res = await api.quizzes.submit(attemptId, payload);
      if (!res?.success) {
        setError(res?.error || 'উত্তর জমা দেওয়া যায়নি');
        return;
      }
      setResult(res.data);
      setExistingAttempt({
        id: res.data.attempt.id,
        status: 'completed',
        score: res.data.attempt.score,
        correct_answers: res.data.correct_answers,
        kori_spent: Number(res.data.attempt.kori_spent),
        kori_earned: res.data.kori_earned,
        completed_at: res.data.attempt.completed_at,
      });
      setPhase('result');
      await refreshBalance();
    } catch (err: any) {
      // 408 = time limit blown server-side; finalize result anyway.
      if (err?.status === 408) {
        setExpired(true);
        setExistingAttempt((prev) =>
          prev
            ? { ...prev, status: 'completed', score: 0, correct_answers: 0, kori_earned: 0 }
            : prev
        );
        try {
          const review = await api.quizzes.getAttempt(attemptId);
          if (review?.success) {
            setReviewFromHistory(review.data.review || []);
          }
        } catch (_) {
          /* ignore */
        }
        setPhase('result');
        await refreshBalance();
      } else {
        setError(err?.response?.data?.error || err?.message || 'উত্তর জমা দেওয়া যায়নি');
      }
    } finally {
      setBusy(false);
    }
  };

  const reviewItems = result?.review ?? reviewFromHistory ?? [];

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round((Object.keys(answers).length / questions.length) * 100);
  }, [answers, questions.length]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">
        <Loader2 className="w-7 h-7 animate-spin inline-block" />
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-red-600 bengali-text">{error}</p>
        <Link href="/quizzes" className="inline-block mt-4 text-primary-600 hover:underline bengali-text">
          কুইজ তালিকায় ফিরুন
        </Link>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/quizzes"
        className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-medium bengali-text mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> অন্যান্য কুইজ
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-3">
          <div className="bg-primary-100 text-primary-700 rounded-2xl p-3">
            <Brain className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 bengali-text">
              <span>{DIFFICULTY_LABEL[preview.difficulty] || preview.difficulty}</span>
              <span>·</span>
              <span>{toBengaliNumber(preview.total_questions)}টি প্রশ্ন</span>
              {preview.creator?.full_name && (
                <>
                  <span>·</span>
                  <span>সৃষ্টিকর্তা: {preview.creator.full_name}</span>
                </>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 bengali-text">{preview.title}</h1>
            {preview.description && (
              <p className="mt-2 text-gray-700 bengali-text">{preview.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full bengali-text">
                <Coins className="w-4 h-4" /> প্রবেশ ফি {toBengaliNumber(preview.entry_cost)}
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full bengali-text">
                <Sparkles className="w-4 h-4" /> প্রতি সঠিক উত্তরে {toBengaliNumber(preview.reward_per_correct)} কড়ি
              </span>
              {user?.kori_balance !== undefined && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full bengali-text">
                  <Coins className="w-4 h-4" /> আপনার ব্যালেন্স {toBengaliNumber(user.kori_balance)}
                </span>
              )}
              {preview.source_content && (
                <Link
                  href={`/read/${preview.source_content.slug}`}
                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full bengali-text hover:bg-emerald-100"
                  title="মূল লেখাটি পড়ুন"
                >
                  📖 {preview.source_content.title}
                </Link>
              )}
              {preview.time_limit_seconds ? (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-3 py-1 rounded-full bengali-text">
                  ⏱️ {formatClock(preview.time_limit_seconds)} সময়সীমা
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {error && phase !== 'result' && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 bengali-text">
          {error}
        </div>
      )}

      {/* Lobby */}
      {phase === 'lobby' && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {existingAttempt?.status === 'completed' ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="bengali-text text-gray-700">
                আপনি এই কুইজ ইতিমধ্যে সম্পন্ন করেছেন। ফলাফল নিচে দেখানো হয়েছে।
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 bengali-text">প্রস্তুত?</h2>
              <p className="text-sm text-gray-600 mt-1 bengali-text">
                &ldquo;কুইজ শুরু করুন&rdquo; চাপলে {toBengaliNumber(preview.entry_cost)} কড়ি কেটে নেওয়া হবে। প্রতিটি কুইজ মাত্র একবার খেলা যায়।
              </p>
              {preview.time_limit_seconds ? (
                <p className="mt-2 inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-1 rounded-full bengali-text">
                  ⏱️ সময়সীমা: {formatClock(preview.time_limit_seconds)}
                </p>
              ) : null}
              <button
                onClick={handleStart}
                disabled={busy}
                className="mt-5 w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold bengali-text inline-flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isLoggedIn ? 'কুইজ শুরু করুন' : 'লগইন করে শুরু করুন'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Playing */}
      {phase === 'playing' && questions.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 pt-5">
            <div className="flex items-center justify-between text-sm text-gray-600 bengali-text">
              <span>
                প্রশ্ন {toBengaliNumber(currentIndex + 1)} / {toBengaliNumber(questions.length)}
              </span>
              <div className="flex items-center gap-3">
                {timeLimitSeconds != null && remainingSeconds != null && (
                  <span
                    className={`px-2 py-0.5 rounded-md font-semibold bengali-text ${
                      remainingSeconds <= 15
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : remainingSeconds <= 60
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    ⏱️ {formatClock(remainingSeconds)}
                  </span>
                )}
                <span>{toBengaliNumber(progress)}% সম্পন্ন</span>
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <PlayQuestion
            question={questions[currentIndex]}
            selected={answers[questions[currentIndex].id]}
            onSelect={(idx) => handleSelect(questions[currentIndex].id, idx)}
          />

          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 bengali-text"
            >
              <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={answers[questions[currentIndex].id] === undefined}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium bengali-text inline-flex items-center gap-1"
              >
                পরবর্তী <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                disabled={busy || Object.keys(answers).length !== questions.length}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium bengali-text inline-flex items-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                ফলাফল জমা দিন
              </button>
            )}
          </div>

          {/* Question pager */}
          <div className="px-6 pb-5 flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const answered = answers[q.id] !== undefined;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-md text-xs font-semibold bengali-text border ${
                    idx === currentIndex
                      ? 'bg-primary-600 border-primary-700 text-white'
                      : answered
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {toBengaliNumber(idx + 1)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Result */}
      {phase === 'result' && expired && (
        <div className="mt-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-5 py-4 bengali-text">
          ⏱️ সময় শেষ হয়ে গিয়েছিল — তাই কোনো কড়ি পাওয়া যায়নি।
        </div>
      )}
      {phase === 'result' && (
        <ResultPanel
          quizId={preview.id}
          preview={preview}
          existingAttempt={existingAttempt}
          result={result}
          reviewItems={reviewItems}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
}

function PlayQuestion({
  question,
  selected,
  onSelect,
}: {
  question: QuizQuestionPlayable;
  selected: number | undefined;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="px-6 py-6">
      <p className="text-lg text-gray-900 font-medium bengali-text">{question.question_text}</p>
      <div className="mt-4 space-y-2">
        {question.options.map((option, idx) => {
          const isSelected = selected === idx;
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all bengali-text ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 text-primary-900'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 text-gray-800'
              }`}
            >
              <span className="font-semibold mr-2">{String.fromCharCode(0x0995 + idx)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultPanel({
  quizId,
  preview,
  existingAttempt,
  result,
  reviewItems,
  currentUserId,
}: {
  quizId: string;
  preview: QuizPreview;
  existingAttempt: AttemptInfo | null;
  result: SubmissionResult | null;
  reviewItems: QuizReviewItem[];
  currentUserId?: string;
}) {
  const correct = result?.correct_answers ?? existingAttempt?.correct_answers ?? 0;
  const total = result?.total_questions ?? preview.total_questions;
  const earned = result?.kori_earned ?? existingAttempt?.kori_earned ?? 0;

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold bengali-text">ফলাফল</h2>
            <p className="text-white/90 bengali-text">
              {toBengaliNumber(correct)} / {toBengaliNumber(total)} সঠিক
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <ResultStat label="সঠিক উত্তর" value={toBengaliNumber(correct)} />
          <ResultStat label="অর্জিত কড়ি" value={toBengaliNumber(earned)} icon={<Coins className="w-4 h-4" />} />
          <ResultStat label="স্কোর শতাংশ" value={`${toBengaliNumber(total ? Math.round((correct / total) * 100) : 0)}%`} />
        </div>
      </div>

      <QuizLeaderboardPanel quizId={quizId} currentUserId={currentUserId} />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-900 bengali-text mb-3">প্রশ্ন পর্যালোচনা</h3>
        <ol className="space-y-4">
          {reviewItems.map((item) => (
            <li key={item.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start gap-2">
                {item.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 bengali-text">
                    {toBengaliNumber(item.position + 1)}. {item.question_text}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {item.options.map((opt, idx) => {
                      const isCorrect = item.correct_index === idx;
                      const isSelected = item.selected_index === idx;
                      let cls = 'text-gray-700';
                      if (isCorrect) cls = 'text-emerald-700 font-medium';
                      else if (isSelected) cls = 'text-red-600';
                      return (
                        <li key={idx} className={`bengali-text ${cls}`}>
                          {isCorrect ? '✓' : isSelected ? '✗' : '•'} {opt}
                        </li>
                      );
                    })}
                  </ul>
                  {item.explanation && (
                    <p className="mt-2 text-sm text-gray-600 bengali-text">
                      <span className="font-medium text-gray-800">ব্যাখ্যা:</span> {item.explanation}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/quizzes"
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium bengali-text"
        >
          আরও কুইজ
        </Link>
        <Link
          href="/quizzes/leaderboard"
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg font-medium bengali-text inline-flex items-center gap-2"
        >
          <Trophy className="w-4 h-4" /> লিডারবোর্ড দেখুন
        </Link>
      </div>
    </div>
  );
}

function ResultStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white/15 rounded-xl p-3 text-center">
      <div className="text-lg font-bold bengali-text flex items-center justify-center gap-1">
        {icon}
        {value}
      </div>
      <div className="text-xs text-white/85 bengali-text mt-1">{label}</div>
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '—';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return toBengaliNumber(`${mm}:${ss}`);
}

function formatDuration(ms: number | null): string {
  if (!ms || !Number.isFinite(ms)) return '—';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${toBengaliNumber(seconds)} সেকেন্ড`;
  return `${toBengaliNumber(minutes)} মি ${toBengaliNumber(seconds)} সে`;
}

function QuizLeaderboardPanel({
  quizId,
  currentUserId,
}: {
  quizId: string;
  currentUserId?: string;
}) {
  const [entries, setEntries] = useState<QuizSpecificLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.quizzes.quizLeaderboard(quizId, 10);
        if (cancelled) return;
        if (res?.success) setEntries(res.data || []);
        else setError(res?.error || 'লিডারবোর্ড লোড করা যায়নি');
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'লিডারবোর্ড লোড করা যায়নি');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 to-primary-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary-600" />
        <h3 className="font-bold text-gray-900 bengali-text">🏆 এই কুইজের লিডারবোর্ড</h3>
      </div>
      {loading ? (
        <div className="py-8 text-center text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin inline-block" />
        </div>
      ) : error ? (
        <div className="py-8 text-center text-red-600 bengali-text">{error}</div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-gray-500 bengali-text">
          এখনও কেউ সম্পন্ন করেনি — আপনিই প্রথম!
        </div>
      ) : (
        <ol className="divide-y divide-gray-100">
          {entries.map((entry) => {
            const isMe = entry.user?.id === currentUserId;
            const medal =
              entry.rank === 1
                ? 'bg-yellow-400 text-white'
                : entry.rank === 2
                ? 'bg-gray-300 text-gray-800'
                : entry.rank === 3
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700';
            return (
              <li
                key={entry.id}
                className={`flex items-center gap-3 px-5 py-3 ${isMe ? 'bg-primary-50/60' : ''}`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bengali-text ${medal}`}
                >
                  {toBengaliNumber(entry.rank)}
                </span>
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
                    {toBengaliNumber(entry.correct_answers)} সঠিক · {formatDuration(entry.duration_ms)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-700 bengali-text">
                    {toBengaliNumber(entry.score)}
                  </p>
                  <p className="text-xs text-amber-700 inline-flex items-center gap-1 bengali-text">
                    <Coins className="w-3 h-3" />
                    {toBengaliNumber(Math.round(entry.kori_earned))}
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
