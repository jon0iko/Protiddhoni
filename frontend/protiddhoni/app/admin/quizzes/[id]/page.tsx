/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Coins,
  Edit3,
  Gavel,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toBengaliNumber } from '@/lib/numberFormatter';
import type { QuizSettlement, RoundPhase } from '@/types';
import {
  EXAM_CATEGORY_OPTIONS,
  PHASE_LABEL,
  PHASE_STYLES,
  formatDateTime,
  fromDatetimeLocal,
  minimumBasePool,
  perQuestionSeconds,
  toDatetimeLocal,
  worstCaseThirdPrize,
} from '@/app/quizzes/_lib/round';

type AdminQuizQuestion = {
  id: string;
  position: number;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation?: string | null;
  language?: 'bn' | 'en' | null;
};

type AdminQuiz = {
  id: string;
  title: string;
  description?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  entry_cost: number;
  total_questions: number;
  status: 'draft' | 'published' | 'archived';
  quiz_type: 'general' | 'exam';
  exam_category?: string | null;
  topic?: string | null;
  language?: 'bn' | 'en' | 'mixed';
  opens_at?: string | null;
  closes_at?: string | null;
  prize_pool: number;
  base_pool: number;
  generation_instructions?: string | null;
  rake_bps: number;
  settled_at?: string | null;
  settlement?: QuizSettlement | null;
  phase: RoundPhase;
  players_joined?: number;
  ai_model?: string | null;
  time_limit_seconds?: number | null;
  published_at?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'খসড়া',
  published: 'প্রকাশিত',
  archived: 'সংরক্ষিত',
};

const EMPTY_QUESTION = {
  question_text: '',
  options: ['', '', '', ''] as string[],
  correct_index: 0,
  explanation: '',
  language: 'bn' as 'bn' | 'en',
};

export default function AdminQuizEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();

  const [quiz, setQuiz] = useState<AdminQuiz | null>(null);
  const [questions, setQuestions] = useState<AdminQuizQuestion[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    quiz_type: 'general' as 'general' | 'exam',
    exam_category: EXAM_CATEGORY_OPTIONS[0],
    topic: '',
    language: 'bn' as 'bn' | 'en' | 'mixed',
    entry_cost: 0,
    rake_bps: 0,
    base_pool: 0,
    generation_instructions: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    time_limit_seconds: 0, // 0 = no limit
    opens_at: '',
    closes_at: '',
  });
  const [genCount, setGenCount] = useState(5);
  const [genLanguage, setGenLanguage] = useState<'bn' | 'en' | 'mixed'>('bn');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [settling, setSettling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ ...EMPTY_QUESTION });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !user?.is_admin)) {
      router.push('/');
    }
  }, [isLoading, isLoggedIn, user, router]);

  useEffect(() => {
    if (!id || !user?.is_admin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.is_admin]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.quizzes.admin.get(id);
      if (res?.success) {
        const q: AdminQuiz = res.data.quiz;
        setQuiz(q);
        setQuestions(res.data.questions || []);
        setForm({
          title: q.title,
          description: q.description || '',
          difficulty: q.difficulty,
          quiz_type: q.quiz_type || 'general',
          exam_category: q.exam_category || EXAM_CATEGORY_OPTIONS[0],
          topic: q.topic || '',
          language: q.language || 'bn',
          entry_cost: Number(q.entry_cost),
          rake_bps: Number(q.rake_bps || 0),
          base_pool: Number(q.base_pool || 0),
          generation_instructions: q.generation_instructions || '',
          status: q.status,
          time_limit_seconds: q.time_limit_seconds ? Number(q.time_limit_seconds) : 0,
          opens_at: toDatetimeLocal(q.opens_at),
          closes_at: toDatetimeLocal(q.closes_at),
        });
        setGenCount(5);
        setGenLanguage(q.language || 'bn');
      } else {
        setFeedback({ type: 'error', message: res?.error || 'রাউন্ড লোড করা যায়নি' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'রাউন্ড লোড করা যায়নি' });
    } finally {
      setLoading(false);
    }
  };

  const economicsLocked = quiz ? !['draft', 'scheduled'].includes(quiz.phase) : false;
  const editMinBase = minimumBasePool(form.entry_cost, form.rake_bps);
  const editPerQuestion = perQuestionSeconds(form.time_limit_seconds, questions.length);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingSettings(true);
    setFeedback(null);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        difficulty: form.difficulty,
        quiz_type: form.quiz_type,
        exam_category: form.quiz_type === 'exam' ? form.exam_category : null,
        topic: form.topic.trim() || null,
        language: form.language,
        generation_instructions: form.generation_instructions.trim() || null,
        status: form.status,
        time_limit_seconds: form.time_limit_seconds > 0 ? Number(form.time_limit_seconds) : null,
      };

      // The server rejects these once the round is live — don't even send them.
      if (!economicsLocked) {
        payload.entry_cost = Number(form.entry_cost);
        payload.rake_bps = Number(form.rake_bps);
        payload.base_pool = Number(form.base_pool);
        payload.opens_at = fromDatetimeLocal(form.opens_at);
        payload.closes_at = fromDatetimeLocal(form.closes_at);
      }

      const res = await api.quizzes.admin.update(id, payload);
      if (res?.success) {
        setQuiz((prev) => (prev ? { ...prev, ...res.data } : prev));
        setFeedback({ type: 'success', message: 'সেটিংস সংরক্ষিত হয়েছে' });
      } else {
        setFeedback({ type: 'error', message: res?.error || 'সংরক্ষণ ব্যর্থ' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.error || err?.message || 'সংরক্ষণ ব্যর্থ',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  /** AI generation APPENDS, so manual edits and curation are never lost. */
  const handleGenerateMore = async () => {
    if (!id) return;
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await api.quizzes.admin.regenerate(id, {
        question_count: genCount,
        language: genLanguage,
      });
      if (res?.success) {
        setQuiz((prev) => (prev ? { ...prev, ...res.data.quiz } : res.data.quiz));
        setQuestions(res.data.questions || []);
        setFeedback({
          type: 'success',
          message: `${toBengaliNumber(res.data.added)} টি নতুন প্রশ্ন যোগ হয়েছে`,
        });
      } else {
        setFeedback({ type: 'error', message: res?.error || 'প্রশ্ন তৈরি ব্যর্থ' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.error || err?.message || 'প্রশ্ন তৈরি ব্যর্থ',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!id) return;
    if (!newQuestion.question_text.trim()) {
      setFeedback({ type: 'error', message: 'প্রশ্ন টেক্সট প্রয়োজন' });
      return;
    }
    if (newQuestion.options.some((o) => !o.trim())) {
      setFeedback({ type: 'error', message: 'চারটি অপশনই পূরণ করুন' });
      return;
    }
    setAdding(true);
    setFeedback(null);
    try {
      const res = await api.quizzes.admin.createQuestion(id, {
        question_text: newQuestion.question_text.trim(),
        options: newQuestion.options.map((o) => o.trim()),
        correct_index: newQuestion.correct_index,
        explanation: newQuestion.explanation.trim() || null,
        language: newQuestion.language,
      });
      if (res?.success) {
        setQuestions((prev) => [...prev, res.data.question]);
        setQuiz((prev) => (prev ? { ...prev, ...res.data.quiz } : prev));
        setNewQuestion({ ...EMPTY_QUESTION, options: ['', '', '', ''] });
        setShowAddForm(false);
        setFeedback({ type: 'success', message: 'প্রশ্ন যোগ হয়েছে' });
      } else {
        setFeedback({ type: 'error', message: res?.error || 'প্রশ্ন যোগ করা যায়নি' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.error || err?.message || 'প্রশ্ন যোগ করা যায়নি',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteQuestion = async (question: AdminQuizQuestion) => {
    if (!confirm('এই প্রশ্নটি মুছে ফেলবেন?')) return;
    setFeedback(null);
    try {
      const res = await api.quizzes.admin.removeQuestion(question.id);
      if (res?.success) {
        setQuestions(res.data.questions || []);
        setQuiz((prev) => (prev ? { ...prev, ...res.data.quiz } : prev));
        setFeedback({ type: 'success', message: 'প্রশ্ন মুছে ফেলা হয়েছে' });
      } else {
        setFeedback({ type: 'error', message: res?.error || 'মুছে ফেলা যায়নি' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.error || err?.message || 'মুছে ফেলা যায়নি',
      });
    }
  };

  const handleSettle = async () => {
    if (!id || !quiz) return;
    if (
      !confirm(
        'এই রাউন্ডটি এখনই চূড়ান্ত করবেন? সেরা ৩ জনকে কড়ি দেওয়া হবে এবং এটি আর ফেরানো যাবে না।'
      )
    ) {
      return;
    }
    setSettling(true);
    setFeedback(null);
    try {
      const res = await api.quizzes.admin.settle(id);
      if (res?.success) {
        setFeedback({
          type: 'success',
          message: res.data.already_settled
            ? 'এই রাউন্ড আগেই চূড়ান্ত হয়েছিল'
            : 'রাউন্ড চূড়ান্ত হয়েছে — বিজয়ীদের কড়ি দেওয়া হয়েছে',
        });
        await load();
      } else {
        setFeedback({ type: 'error', message: res?.error || 'চূড়ান্ত করা যায়নি' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.error || err?.message || 'চূড়ান্ত করা যায়নি',
      });
    } finally {
      setSettling(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !quiz) return;
    if (!confirm(`"${quiz.title}" মুছে ফেলবেন?`)) return;
    setDeleting(true);
    try {
      const res = await api.quizzes.admin.remove(id);
      if (res?.success) router.push('/admin/quizzes');
      else setFeedback({ type: 'error', message: res?.error || 'মুছে ফেলা যায়নি' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'মুছে ফেলা যায়নি' });
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading || loading || !quiz) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin inline-block" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        href="/admin/quizzes"
        className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-medium bengali-text"
      >
        <ArrowLeft className="w-4 h-4" /> কুইজ তালিকায় ফিরুন
      </Link>

      {/* Round panel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full bengali-text ${PHASE_STYLES[quiz.phase]}`}>
                {PHASE_LABEL[quiz.phase]}
              </span>
              <span className="text-xs text-gray-500 bengali-text">
                {STATUS_LABEL[quiz.status]} · {toBengaliNumber(quiz.total_questions)} প্রশ্ন
                {quiz.ai_model ? ` · ${quiz.ai_model}` : ''}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 bengali-text mt-1.5">{quiz.title}</h1>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-1 bengali-text disabled:opacity-60"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            মুছে ফেলুন
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RoundStat
            label="পুরস্কার তহবিল"
            value={toBengaliNumber(Math.round(Number(quiz.prize_pool) || 0))}
            icon={<Coins className="w-4 h-4 text-amber-600" />}
            emphasis
          />
          <RoundStat
            label="অংশগ্রহণকারী"
            value={toBengaliNumber(quiz.players_joined ?? 0)}
            icon={<Users className="w-4 h-4 text-blue-600" />}
          />
          <RoundStat label="শুরু" value={formatDateTime(quiz.opens_at)} />
          <RoundStat label="শেষ" value={formatDateTime(quiz.closes_at)} />
        </div>

        {quiz.settled_at ? (
          <div className="mt-4 rounded-xl bg-violet-50 border border-violet-200 px-4 py-3">
            <p className="text-sm font-semibold text-violet-800 bengali-text">
              চূড়ান্ত হয়েছে: {formatDateTime(quiz.settled_at)}
            </p>
            {quiz.settlement && (
              <div className="mt-2 text-xs text-violet-900/80 bengali-text space-y-0.5">
                <p>
                  তহবিল {toBengaliNumber(Math.round(quiz.settlement.pool))} · হাউস কাট{' '}
                  {toBengaliNumber(Math.round(quiz.settlement.rake))} · বিতরণ{' '}
                  {toBengaliNumber(Math.round(quiz.settlement.paid))}
                </p>
                {(quiz.settlement.winners || []).map((w) => (
                  <p key={w.attempt_id}>
                    {toBengaliNumber(w.rank)}ম — স্কোর {toBengaliNumber(w.score)} —{' '}
                    {toBengaliNumber(Math.round(w.amount))} কড়ি
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600 bengali-text">
              রাউন্ড শেষ হলে স্বয়ংক্রিয়ভাবে চূড়ান্ত হয়। প্রয়োজনে এখানে ম্যানুয়ালি চালাতে পারেন।
            </p>
            <button
              onClick={handleSettle}
              disabled={settling || quiz.phase !== 'closed'}
              title={
                quiz.phase !== 'closed'
                  ? 'রাউন্ডের শেষ সময় পার হলে তবেই চূড়ান্ত করা যাবে'
                  : undefined
              }
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium bengali-text inline-flex items-center gap-2"
            >
              {settling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
              এখনই চূড়ান্ত করুন
            </button>
          </div>
        )}

        {feedback && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 bengali-text ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 bengali-text mb-4">রাউন্ড সেটিংস</h2>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <Field label="শিরোনাম">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
            />
          </Field>
          <Field label="বিবরণ">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="ধরন">
              <select
                value={form.quiz_type}
                onChange={(e) => setForm({ ...form, quiz_type: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text"
              >
                <option value="general">সাধারণ</option>
                <option value="exam">পরীক্ষা</option>
              </select>
            </Field>
            <Field label="পরীক্ষার বিভাগ">
              <select
                value={form.exam_category}
                disabled={form.quiz_type !== 'exam'}
                onChange={(e) => setForm({ ...form, exam_category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text disabled:bg-gray-50 disabled:text-gray-400"
              >
                {EXAM_CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="কঠিনতা">
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text"
              >
                <option value="easy">সহজ</option>
                <option value="medium">মাঝারি</option>
                <option value="hard">কঠিন</option>
              </select>
            </Field>
            <Field label="ভাষা — AI এই ভাষায় প্রশ্ন লিখবে">
              <select
                value={form.language}
                onChange={(e) => {
                  const language = e.target.value as 'bn' | 'en' | 'mixed';
                  // Keep the generate toolbar in step with the round setting.
                  setForm({ ...form, language });
                  setGenLanguage(language);
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text"
              >
                <option value="bn">বাংলা</option>
                <option value="en">English</option>
                <option value="mixed">মিশ্র (বাংলা + English)</option>
              </select>
            </Field>
          </div>

          <Field label="বিষয় (topic)">
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text"
            />
          </Field>

          <Field label="অতিরিক্ত নির্দেশনা — AI প্রশ্ন তৈরির সময় মানবে">
            <textarea
              value={form.generation_instructions}
              onChange={(e) => setForm({ ...form, generation_instructions: e.target.value })}
              rows={4}
              placeholder="যেমন: শুধু ১৯৪৭-পরবর্তী কবিতা থেকে প্রশ্ন করুন। নজরুলের গান বাদ দিন।"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text"
            />
            <p className="text-xs text-gray-500 bengali-text mt-1">
              নিচের &ldquo;আরও প্রশ্ন তৈরি&rdquo; এই নির্দেশনা অনুসরণ করবে।
            </p>
          </Field>

          {economicsLocked && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 bengali-text">
              রাউন্ড চালু হয়ে গেছে — প্রবেশ ফি, হাউস কাট, বেস পুল ও সময়সূচি আর পরিবর্তন করা যাবে না।
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="প্রবেশ ফি">
              <div className="relative">
                <Coins className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-yellow-700" />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  disabled={economicsLocked}
                  value={form.entry_cost}
                  onChange={(e) => setForm({ ...form, entry_cost: Number(e.target.value) })}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </Field>
            <Field label="হাউস কাট (bps)">
              <input
                type="number"
                min={0}
                max={10000}
                step={50}
                disabled={economicsLocked}
                value={form.rake_bps}
                onChange={(e) => setForm({ ...form, rake_bps: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text disabled:bg-gray-50 disabled:text-gray-400"
              />
            </Field>
            <Field label="সময়সীমা (সেকেন্ড) — ০ = সীমা নেই">
              <input
                type="number"
                min={0}
                max={3600}
                step={10}
                value={form.time_limit_seconds}
                onChange={(e) => setForm({ ...form, time_limit_seconds: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text"
              />
            </Field>
          </div>

          <Field label="বেস পুল (কড়ি) — হাউস থেকে দেওয়া প্রাথমিক পুরস্কার">
            <div className="relative">
              <Coins className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-yellow-700" />
              <input
                type="number"
                min={0}
                step={1}
                disabled={economicsLocked}
                value={form.base_pool}
                onChange={(e) => setForm({ ...form, base_pool: Number(e.target.value) })}
                className={`w-full pl-9 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary-500 bengali-text disabled:bg-gray-50 disabled:text-gray-400 ${
                  !economicsLocked && form.base_pool < editMinBase ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
          </Field>

          {!economicsLocked && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm bengali-text ${
                form.base_pool < editMinBase
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <span>
                  সর্বনিম্ন বেস পুল: <strong>{editMinBase}</strong> কড়ি
                </span>
                <span>
                  ৩ জন অংশগ্রহণকারী হলে তৃতীয় স্থান পাবে:{' '}
                  <strong>
                    {worstCaseThirdPrize(form.base_pool, form.entry_cost, form.rake_bps).toFixed(2)}
                  </strong>{' '}
                  কড়ি
                </span>
              </div>
              {editPerQuestion !== null && (
                <p className="mt-1 text-xs">
                  প্রশ্নপ্রতি সময় প্রায় <strong>{editPerQuestion}</strong> সেকেন্ড
                  ({questions.length} প্রশ্ন) — সময় শেষে উত্তর লক হয়ে যাবে, পিছনে ফেরা যাবে না।
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="শুরুর সময়">
              <input
                type="datetime-local"
                disabled={economicsLocked}
                value={form.opens_at}
                onChange={(e) => setForm({ ...form, opens_at: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text disabled:bg-gray-50 disabled:text-gray-400"
              />
            </Field>
            <Field label="শেষের সময়">
              <input
                type="datetime-local"
                disabled={economicsLocked}
                value={form.closes_at}
                onChange={(e) => setForm({ ...form, closes_at: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text disabled:bg-gray-50 disabled:text-gray-400"
              />
            </Field>
            <Field label="অবস্থা">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text"
              >
                <option value="draft">খসড়া</option>
                <option value="published">প্রকাশিত</option>
                <option value="archived">সংরক্ষিত</option>
              </select>
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium bengali-text inline-flex items-center gap-2 disabled:opacity-60"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              সেটিংস সংরক্ষণ
            </button>
          </div>
        </form>
      </div>

      {/* Question authoring */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold text-gray-900 bengali-text">প্রশ্ন যোগ করুন</h2>
            <p className="text-sm text-gray-500 bengali-text">
              AI দিয়ে বানানো প্রশ্ন বিদ্যমান তালিকার শেষে যোগ হয় — আপনার সম্পাদনা নষ্ট হয় না।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={1}

              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value))}
              className="w-20 px-3 py-2 rounded-lg border border-gray-300 bengali-text"
              aria-label="প্রশ্নসংখ্যা"
            />
            <select
              value={genLanguage}
              onChange={(e) => setGenLanguage(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-300 bengali-text"
              aria-label="ভাষা"
            >
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
              <option value="mixed">মিশ্র</option>
            </select>
            <button
              onClick={handleGenerateMore}
              disabled={generating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium bengali-text inline-flex items-center gap-2 disabled:opacity-60"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              AI দিয়ে আরও
            </button>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium bengali-text inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> হাতে লিখুন
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="mt-5 border border-primary-200 bg-primary-50/40 rounded-xl p-4 space-y-3">
            <textarea
              value={newQuestion.question_text}
              onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
              rows={3}
              placeholder="প্রশ্ন লিখুন"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 bengali-text"
            />
            <div className="space-y-2">
              {newQuestion.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 shrink-0">
                    <input
                      type="radio"
                      name="new-question-correct"
                      checked={newQuestion.correct_index === idx}
                      onChange={() => setNewQuestion({ ...newQuestion, correct_index: idx })}
                      className="accent-emerald-600"
                      aria-label="সঠিক উত্তর হিসেবে সেট করুন"
                    />
                    <span className="text-sm text-gray-700 bengali-text w-8">
                      {String.fromCharCode(0x0995 + idx)}.
                    </span>
                  </label>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...newQuestion.options];
                      next[idx] = e.target.value;
                      setNewQuestion({ ...newQuestion, options: next });
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg border ${
                      newQuestion.correct_index === idx
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-gray-300'
                    } focus:ring-2 focus:ring-primary-500 bengali-text`}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Field label="ভাষা">
                <select
                  value={newQuestion.language}
                  onChange={(e) => setNewQuestion({ ...newQuestion, language: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bengali-text"
                >
                  <option value="bn">বাংলা</option>
                  <option value="en">English</option>
                </select>
              </Field>
              <div className="sm:col-span-3">
                <Field label="ব্যাখ্যা (ঐচ্ছিক)">
                  <input
                    type="text"
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bengali-text"
                  />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium bengali-text"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleAddQuestion}
                disabled={adding}
                className="px-3 py-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium bengali-text inline-flex items-center gap-1 disabled:opacity-60"
              >
                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                যোগ করুন
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Question list */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 bengali-text mb-3">প্রশ্নসমূহ</h2>
        <p className="text-xs text-gray-500 mb-3 bengali-text">
          কোনো প্রশ্ন ভুল হলে পেন্সিল আইকনে চাপ দিয়ে শুধু সেই প্রশ্নটাই ঠিক করুন — বাকিগুলো অপরিবর্তিত থাকবে।
        </p>
        {questions.length === 0 ? (
          <p className="text-sm text-gray-500 bengali-text">কোনো প্রশ্ন নেই।</p>
        ) : (
          <ol className="space-y-4">
            {questions.map((q) => (
              <EditableQuestion
                key={q.id}
                question={q}
                onDelete={() => handleDeleteQuestion(q)}
                onSaved={(updated) =>
                  setQuestions((prev) =>
                    prev.map((other) => (other.id === updated.id ? { ...other, ...updated } : other))
                  )
                }
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function RoundStat({
  label,
  value,
  icon,
  emphasis,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        emphasis ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <p className="text-[11px] text-gray-500 bengali-text">{label}</p>
      <p
        className={`font-bold bengali-text inline-flex items-center gap-1 ${
          emphasis ? 'text-2xl text-amber-800' : 'text-sm text-gray-900'
        }`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 bengali-text">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function EditableQuestion({
  question,
  onSaved,
  onDelete,
}: {
  question: AdminQuizQuestion;
  onSaved: (updated: AdminQuizQuestion) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    question_text: question.question_text,
    options: [...question.options] as string[],
    correct_index: question.correct_index,
    explanation: question.explanation || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setDraft({
      question_text: question.question_text,
      options: [...question.options],
      correct_index: question.correct_index,
      explanation: question.explanation || '',
    });
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    if (!draft.question_text.trim()) {
      setError('প্রশ্ন টেক্সট প্রয়োজন');
      return;
    }
    if (draft.options.some((o) => !o.trim())) {
      setError('চারটি অপশনই পূরণ করুন');
      return;
    }
    if (!Number.isInteger(draft.correct_index) || draft.correct_index < 0 || draft.correct_index > 3) {
      setError('সঠিক উত্তর নির্বাচন করুন');
      return;
    }

    setSaving(true);
    try {
      const res = await api.quizzes.admin.updateQuestion(question.id, {
        question_text: draft.question_text.trim(),
        options: draft.options.map((o) => o.trim()),
        correct_index: draft.correct_index,
        explanation: draft.explanation.trim() || null,
      });
      if (res?.success) {
        onSaved({
          ...question,
          question_text: res.data.question_text,
          options: res.data.options,
          correct_index: res.data.correct_index,
          explanation: res.data.explanation,
        });
        setEditing(false);
      } else {
        setError(res?.error || 'সংরক্ষণ ব্যর্থ');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'সংরক্ষণ ব্যর্থ');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <li className="border border-gray-100 rounded-xl p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-gray-900 bengali-text flex-1">
            {toBengaliNumber(question.position + 1)}. {question.question_text}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {question.language && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 uppercase">
                {question.language}
              </span>
            )}
            <button
              type="button"
              onClick={startEdit}
              className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 inline-flex items-center gap-1 bengali-text"
            >
              <Edit3 className="w-3 h-3" /> সম্পাদনা
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-1 bengali-text"
            >
              <Trash2 className="w-3 h-3" /> মুছুন
            </button>
          </div>
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {question.options.map((opt, idx) => {
            const isCorrect = idx === question.correct_index;
            return (
              <li
                key={idx}
                className={`bengali-text ${isCorrect ? 'text-emerald-700 font-semibold' : 'text-gray-700'}`}
              >
                {isCorrect ? <CheckCircle2 className="w-4 h-4 inline-block mr-1" /> : '•'} {opt}
              </li>
            );
          })}
        </ul>
        {question.explanation && (
          <p className="mt-2 text-sm text-gray-600 bengali-text">
            <span className="font-medium text-gray-800">ব্যাখ্যা:</span> {question.explanation}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className="border border-primary-200 bg-primary-50/40 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary-700 bengali-text">
          প্রশ্ন {toBengaliNumber(question.position + 1)} সম্পাদনা
        </span>
        <button
          type="button"
          onClick={cancelEdit}
          className="text-gray-400 hover:text-gray-700"
          aria-label="বাতিল"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <textarea
        value={draft.question_text}
        onChange={(e) => setDraft({ ...draft, question_text: e.target.value })}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
      />
      <div className="space-y-2">
        {draft.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 shrink-0">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={draft.correct_index === idx}
                onChange={() => setDraft({ ...draft, correct_index: idx })}
                className="accent-emerald-600"
                aria-label="সঠিক উত্তর হিসেবে সেট করুন"
              />
              <span className="text-sm text-gray-700 bengali-text w-8">
                {String.fromCharCode(0x0995 + idx)}.
              </span>
            </label>
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                const next = [...draft.options];
                next[idx] = e.target.value;
                setDraft({ ...draft, options: next });
              }}
              className={`flex-1 px-3 py-2 rounded-lg border ${
                draft.correct_index === idx
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-gray-300'
              } focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text`}
            />
          </div>
        ))}
      </div>
      <Field label="ব্যাখ্যা (ঐচ্ছিক)">
        <textarea
          value={draft.explanation}
          onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
        />
      </Field>
      {error && <p className="text-sm text-red-600 bengali-text">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={cancelEdit}
          className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium bengali-text"
        >
          বাতিল
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium bengali-text inline-flex items-center gap-1 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          সংরক্ষণ
        </button>
      </div>
    </li>
  );
}
