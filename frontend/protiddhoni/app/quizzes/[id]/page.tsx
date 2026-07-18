/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Coins,
  GraduationCap,
  Loader2,
  Sparkles,
  Timer,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toBengaliNumber } from '@/lib/numberFormatter';
import type {
  QuizAttemptStatus,
  QuizQuestionPlayable,
  QuizReviewItem,
  QuizSettlement,
  QuizSpecificLeaderboardEntry,
  RoundPhase,
} from '@/types';
import {
  DIFFICULTY_LABEL,
  PHASE_LABEL,
  PHASE_STYLES,
  formatClock,
  formatCountdown,
  formatDateTime,
  formatDuration,
  msUntil,
} from '../_lib/round';

type QuizPreview = {
  id: string;
  title: string;
  description?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  entry_cost: number;
  total_questions: number;
  time_limit_seconds?: number | null;
  quiz_type: 'general' | 'exam';
  exam_category?: string | null;
  topic?: string | null;
  opens_at?: string | null;
  closes_at?: string | null;
  prize_pool: number;
  settled_at?: string | null;
  settlement?: QuizSettlement | null;
  phase: RoundPhase;
  players_joined?: number;
  creator?: { id: string; username: string; full_name: string } | null;
  published_at?: string | null;
};

type AttemptInfo = {
  id: string;
  status: QuizAttemptStatus;
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
  payout_pending?: boolean;
  closes_at?: string | null;
  balance_after: number | null;
  review: QuizReviewItem[];
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
  const [entering, setEntering] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const expiredRef = useRef(false); // ensures the countdown auto-submits exactly once
  const submittingRef = useRef(false); // guards against duplicate/overlapping submits

  // Single ticker for every round countdown on this page.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const handle = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

  const loadPreview = useCallback(async () => {
    if (!quizId) return null;
    const res = await api.quizzes.getPreview(quizId);
    if (!res?.success) return null;
    setPreview(res.data.quiz);
    setExistingAttempt(res.data.user_attempt || null);
    return res.data;
  }, [quizId]);

  useEffect(() => {
    if (!quizId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadPreview();
        if (!data) {
          setError('কুইজ লোড করা যায়নি');
          return;
        }

        if (data.user_attempt?.status === 'completed') {
          try {
            const attemptRes = await api.quizzes.getAttempt(data.user_attempt.id);
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
  }, [quizId, loadPreview]);

  // Once a round settles, refresh the preview so the payout can be shown.
  const settlementPending =
    phase === 'result' && preview && !preview.settled_at && preview.phase === 'closed';
  useEffect(() => {
    if (!settlementPending) return;
    const handle = window.setInterval(() => {
      loadPreview().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(handle);
  }, [settlementPending, loadPreview]);

  const handleEnter = async () => {
    if (!quizId) return;
    if (!isLoggedIn) {
      router.push(`/login?redirect=/quizzes/${quizId}`);
      return;
    }
    setEntering(true);
    setError(null);
    try {
      const res = await api.quizzes.enter(quizId);
      if (!res?.success) {
        setError(res?.error || 'রাউন্ডে যোগ দেওয়া যায়নি');
        return;
      }
      await loadPreview();
      await refreshBalance();
    } catch (err: any) {
      const status = err?.status;
      const message = err?.response?.data?.error || err?.message || 'রাউন্ডে যোগ দেওয়া যায়নি';
      if (status === 402) setError('পর্যাপ্ত কড়ি নেই — ওয়ালেটে কড়ি যোগ করুন।');
      else setError(message);
    } finally {
      setEntering(false);
    }
  };

  const handleStart = async () => {
    if (!quizId) return;
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
      startedAtRef.current = res.data.started_at
        ? new Date(res.data.started_at).getTime()
        : Date.now();
      const limit = Number(res.data?.quiz?.time_limit_seconds) || null;
      setTimeLimitSeconds(limit);
      setRemainingSeconds(limit);
      setExpired(false);
      expiredRef.current = false;
      submittingRef.current = false;
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'কুইজ শুরু করা যায়নি';
      setError(message);
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
    let handle: number | undefined;
    const tick = () => {
      const elapsedSec = Math.floor((Date.now() - (startedAtRef.current ?? Date.now())) / 1000);
      const remaining = Math.max(0, timeLimitSeconds - elapsedSec);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        // Stop the ticker right away so it can't keep firing submit requests,
        // then auto-submit whatever has been answered exactly once.
        if (handle !== undefined) window.clearInterval(handle);
        if (!expiredRef.current) {
          expiredRef.current = true;
          setExpired(true);
          handleSubmit({ auto: true });
        }
      }
    };
    tick();
    handle = window.setInterval(tick, 1000);
    return () => {
      if (handle !== undefined) window.clearInterval(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLimitSeconds]);

  const handleSubmit = async (opts?: { auto?: boolean }) => {
    if (!attemptId) return;
    const isAuto = Boolean(opts?.auto);
    if (!isAuto && Object.keys(answers).length !== questions.length) {
      setError('সব প্রশ্নের উত্তর দিন');
      return;
    }
    // Submit at most once — the countdown tick and the manual button must never
    // fire overlapping or repeated submissions.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const duration = startedAtRef.current ? Date.now() - startedAtRef.current : undefined;
      // On auto-submit (timer expired), only send the questions that were
      // actually answered. The server treats everything else as unanswered.
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
        // A timed-out attempt must still land on the result page; a manual
        // submit can be retried.
        if (isAuto) setPhase('result');
        else submittingRef.current = false;
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
      // 409 = the server already finalized this attempt (e.g. a duplicate
      // submit); 408 = legacy hard timeout. In both cases load the stored
      // result so the player still sees their graded answers.
      if (err?.status === 409 || err?.status === 408) {
        try {
          const review = await api.quizzes.getAttempt(attemptId);
          if (review?.success) {
            setReviewFromHistory(review.data.review || []);
            const a = review.data.attempt;
            if (a) {
              setExistingAttempt({
                id: a.id,
                status: 'completed',
                score: a.score ?? 0,
                correct_answers: a.correct_answers ?? 0,
                kori_spent: Number(a.kori_spent ?? 0),
                kori_earned: a.kori_earned ?? 0,
                completed_at: a.completed_at,
              });
            }
          }
        } catch (_) {
          /* ignore */
        }
        setPhase('result');
        await refreshBalance();
      } else {
        setError(err?.response?.data?.error || err?.message || 'উত্তর জমা দেওয়া যায়নি');
        // Don't strand the player mid-quiz on a timed-out auto-submit.
        if (isAuto) setPhase('result');
        else submittingRef.current = false;
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

  const roundPhase: RoundPhase = preview.phase || 'open';
  const hasEntered = Boolean(existingAttempt);
  const closesIn = msUntil(preview.closes_at, nowMs);
  const opensIn = msUntil(preview.opens_at, nowMs);

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
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className={`px-2 py-0.5 rounded-full bengali-text ${PHASE_STYLES[roundPhase]}`}>
                {PHASE_LABEL[roundPhase]}
              </span>
              {preview.quiz_type === 'exam' && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {preview.exam_category || 'পরীক্ষা'}
                </span>
              )}
              <span className="text-gray-500 bengali-text">
                {DIFFICULTY_LABEL[preview.difficulty] || preview.difficulty}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 bengali-text">
                {toBengaliNumber(preview.total_questions)}টি প্রশ্ন
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold text-gray-900 bengali-text">{preview.title}</h1>
            {preview.description && (
              <p className="mt-2 text-gray-700 bengali-text">{preview.description}</p>
            )}
            {preview.topic && (
              <p className="mt-1 text-sm text-gray-500 bengali-text">বিষয়: {preview.topic}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full bengali-text">
                <Coins className="w-4 h-4" /> প্রবেশ ফি {toBengaliNumber(preview.entry_cost)}
              </span>
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full bengali-text">
                <Users className="w-4 h-4" /> {toBengaliNumber(preview.players_joined ?? 0)} জন
              </span>
              {user?.kori_balance !== undefined && (
                <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 px-3 py-1 rounded-full bengali-text">
                  <Coins className="w-4 h-4" /> আপনার ব্যালেন্স {toBengaliNumber(user.kori_balance)}
                </span>
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

      {/* Lobby — either CONFIRM ENTRY or the room, depending on whether the
          player has already paid into the pool. */}
      {phase === 'lobby' && !hasEntered && (
        <ConfirmEntryPanel
          preview={preview}
          roundPhase={roundPhase}
          opensIn={opensIn}
          closesIn={closesIn}
          isLoggedIn={isLoggedIn}
          entering={entering}
          onConfirm={handleEnter}
        />
      )}

      {phase === 'lobby' && hasEntered && (
        <RoomPanel
          preview={preview}
          roundPhase={roundPhase}
          closesIn={closesIn}
          attempt={existingAttempt}
          busy={busy}
          onStart={handleStart}
          currentUserId={user?.id}
        />
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
          ⏱️ সময় শেষ হয়ে গিয়েছিল — আপনার দেওয়া উত্তরগুলো জমা নেওয়া হয়েছে।
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
          closesIn={closesIn}
        />
      )}
    </div>
  );
}

/** Step 1: show the player exactly what entering costs and what it buys. */
function ConfirmEntryPanel({
  preview,
  roundPhase,
  opensIn,
  closesIn,
  isLoggedIn,
  entering,
  onConfirm,
}: {
  preview: QuizPreview;
  roundPhase: RoundPhase;
  opensIn: number | null;
  closesIn: number | null;
  isLoggedIn: boolean;
  entering: boolean;
  onConfirm: () => void;
}) {
  const canEnter = roundPhase === 'open';

  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 px-6 py-5 text-center">
        <p className="text-xs uppercase tracking-wide text-amber-700 bengali-text">পুরস্কার তহবিল</p>
        <p className="text-5xl font-extrabold text-amber-800 bengali-text mt-1 inline-flex items-center gap-2">
          <Coins className="w-9 h-9" />
          {toBengaliNumber(Math.round(Number(preview.prize_pool) || 0))}
        </p>
        <p className="mt-2 text-sm text-amber-800/80 bengali-text">
          সেরা ৩ জন ভাগ করে নেবেন — ৫০% / ৩০% / ২০%
        </p>
      </div>

      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 bengali-text">প্রবেশ নিশ্চিত করুন</h2>
        <p className="text-sm text-gray-600 mt-1 bengali-text">
          নিশ্চিত করলে আপনার ওয়ালেট থেকে{' '}
          <strong className="text-gray-900">{toBengaliNumber(preview.entry_cost)} কড়ি</strong> কেটে
          সরাসরি এই রাউন্ডের পুরস্কার তহবিলে যোগ হবে। প্রতিটি রাউন্ডে একবারই অংশ নেওয়া যায়, এবং
          প্রবেশ ফি ফেরতযোগ্য নয়।
        </p>

        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <InfoTile label="প্রবেশ ফি" value={toBengaliNumber(preview.entry_cost)} />
          <InfoTile label="তহবিল" value={toBengaliNumber(Math.round(Number(preview.prize_pool) || 0))} />
          <InfoTile label="যোগ দিয়েছেন" value={toBengaliNumber(preview.players_joined ?? 0)} />
          <InfoTile
            label={roundPhase === 'scheduled' ? 'শুরু হবে' : 'শেষ হবে'}
            value={formatCountdown(roundPhase === 'scheduled' ? opensIn : closesIn)}
          />
        </dl>

        {preview.closes_at && (
          <p className="mt-3 text-xs text-gray-500 bengali-text text-center">
            ফলাফল ও পুরস্কার চূড়ান্ত হবে: {formatDateTime(preview.closes_at)}
          </p>
        )}

        {!canEnter ? (
          <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-center text-gray-600 bengali-text">
            {roundPhase === 'scheduled'
              ? 'এই রাউন্ড এখনো শুরু হয়নি — নির্ধারিত সময়ে ফিরে আসুন।'
              : 'এই রাউন্ডে আর প্রবেশ করা যাবে না।'}
          </div>
        ) : (
          <button
            onClick={onConfirm}
            disabled={entering}
            className="mt-5 w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold bengali-text inline-flex items-center justify-center gap-2"
          >
            {entering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
            {isLoggedIn
              ? `${toBengaliNumber(preview.entry_cost)} কড়ি দিয়ে প্রবেশ নিশ্চিত করুন`
              : 'লগইন করে প্রবেশ করুন'}
          </button>
        )}
      </div>
    </div>
  );
}

/** Step 2: the room — Start button, live room leaderboard, finalization clock. */
function RoomPanel({
  preview,
  roundPhase,
  closesIn,
  attempt,
  busy,
  onStart,
  currentUserId,
}: {
  preview: QuizPreview;
  roundPhase: RoundPhase;
  closesIn: number | null;
  attempt: AttemptInfo | null;
  busy: boolean;
  onStart: () => void;
  currentUserId?: string;
}) {
  const alreadyPlayed = attempt?.status === 'completed';
  const canPlay = roundPhase === 'open' && !alreadyPlayed;
  const urgent = closesIn != null && closesIn > 0 && closesIn < 5 * 60 * 1000;

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bengali-text">
              <CheckCircle2 className="w-4 h-4" /> আপনি এই রাউন্ডে আছেন
            </p>
            <p className="text-sm text-gray-600 mt-1 bengali-text">
              {toBengaliNumber(attempt?.kori_spent ?? preview.entry_cost)} কড়ি তহবিলে জমা হয়েছে।
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-amber-700 bengali-text">তহবিল</p>
            <p className="text-2xl font-extrabold text-amber-800 bengali-text inline-flex items-center gap-1">
              <Coins className="w-5 h-5" />
              {toBengaliNumber(Math.round(Number(preview.prize_pool) || 0))}
            </p>
          </div>
        </div>

        <div
          className={`mt-5 rounded-xl px-4 py-3 flex items-center justify-between gap-3 bengali-text ${
            urgent ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-gray-50 border border-gray-200 text-gray-700'
          }`}
        >
          <span className="inline-flex items-center gap-2 text-sm">
            <Timer className="w-4 h-4" /> বিজয়ী চূড়ান্ত হবে
          </span>
          <span className="font-bold">{formatCountdown(closesIn)}</span>
        </div>

        {alreadyPlayed ? (
          <p className="mt-5 text-center text-sm text-gray-600 bengali-text">
            আপনার স্কোর জমা হয়ে গেছে — রাউন্ড শেষ হলে পুরস্কার বিতরণ হবে।
          </p>
        ) : canPlay ? (
          <button
            onClick={onStart}
            disabled={busy}
            className="mt-5 w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold bengali-text inline-flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {attempt?.status === 'in_progress' ? 'খেলা চালিয়ে যান' : 'শুরু করুন'}
          </button>
        ) : (
          <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-center text-gray-600 bengali-text">
            {roundPhase === 'scheduled'
              ? 'রাউন্ড শুরু হলে খেলতে পারবেন।'
              : 'রাউন্ডের সময় শেষ — আর খেলা যাবে না।'}
          </div>
        )}

        {preview.time_limit_seconds ? (
          <p className="mt-3 text-center text-xs text-gray-500 bengali-text">
            শুরু করার পর আপনার হাতে {formatClock(preview.time_limit_seconds)} সময় থাকবে।
          </p>
        ) : null}
      </div>

      <QuizLeaderboardPanel quizId={preview.id} currentUserId={currentUserId} />
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
      <dt className="text-[11px] text-gray-500 bengali-text">{label}</dt>
      <dd className="text-lg font-bold text-gray-900 bengali-text">{value}</dd>
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
  closesIn,
}: {
  quizId: string;
  preview: QuizPreview;
  existingAttempt: AttemptInfo | null;
  result: SubmissionResult | null;
  reviewItems: QuizReviewItem[];
  currentUserId?: string;
  closesIn: number | null;
}) {
  const correct = result?.correct_answers ?? existingAttempt?.correct_answers ?? 0;
  const total = result?.total_questions ?? preview.total_questions;

  const settled = Boolean(preview.settled_at);
  const myWin = settled
    ? (preview.settlement?.winners || []).find((w) => w.user_id === currentUserId)
    : undefined;
  const payout = Number(myWin?.amount ?? existingAttempt?.kori_earned ?? 0);

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
          <ResultStat
            label={settled ? 'জেতা কড়ি' : 'তহবিল'}
            value={toBengaliNumber(
              Math.round(settled ? payout : Number(preview.prize_pool) || 0)
            )}
            icon={<Coins className="w-4 h-4" />}
          />
          <ResultStat
            label="স্কোর শতাংশ"
            value={`${toBengaliNumber(total ? Math.round((correct / total) * 100) : 0)}%`}
          />
        </div>
      </div>

      {/* Payout status — pending until the round closes and settles */}
      {settled ? (
        myWin ? (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 text-amber-900 bengali-text">
            <p className="font-bold text-lg">
              🏆 আপনি {toBengaliNumber(myWin.rank)}ম স্থান অধিকার করেছেন!
            </p>
            <p className="mt-1 text-sm">
              {toBengaliNumber(Math.round(payout))} কড়ি আপনার ওয়ালেটে যোগ করা হয়েছে।
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-700 bengali-text">
            এই রাউন্ডটি চূড়ান্ত হয়েছে। এবার সেরা তিনে জায়গা হয়নি — পরের রাউন্ডে আবার চেষ্টা করুন!
          </div>
        )
      ) : (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl px-5 py-4 text-sky-900 bengali-text">
          <p className="font-semibold">✅ আপনার স্কোর নিশ্চিত হয়েছে</p>
          <p className="mt-1 text-sm">
            পুরস্কার বিতরণ হবে {formatDateTime(preview.closes_at)} — আর{' '}
            <strong>{formatCountdown(closesIn)}</strong> বাকি। সেরা ৩ জন তহবিলের ৫০/৩০/২০ ভাগ পাবেন,
            এবং কড়ি স্বয়ংক্রিয়ভাবে ওয়ালেটে জমা হবে।
          </p>
        </div>
      )}

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
    // Refresh periodically so the room board stays live while people play.
    const handle = window.setInterval(load, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [quizId]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 to-primary-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary-600" />
        <h3 className="font-bold text-gray-900 bengali-text">🏆 এই রাউন্ডের লিডারবোর্ড</h3>
      </div>
      {loading ? (
        <div className="py-8 text-center text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin inline-block" />
        </div>
      ) : error ? (
        <div className="py-8 text-center text-red-600 bengali-text">{error}</div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-gray-500 bengali-text">
          এখনও কেউ সম্পন্ন করেনি — আপনিই প্রথম হতে পারেন!
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
                  {Number(entry.kori_earned) > 0 && (
                    <p className="text-xs text-amber-700 inline-flex items-center gap-1 bengali-text">
                      <Coins className="w-3 h-3" />
                      {toBengaliNumber(Math.round(entry.kori_earned))}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
