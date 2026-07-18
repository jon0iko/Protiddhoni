/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Brain, Coins, GraduationCap, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  EXAM_CATEGORY_OPTIONS,
  fromDatetimeLocal,
  minimumBasePool,
  perQuestionSeconds,
  worstCaseThirdPrize,
} from '@/app/quizzes/_lib/round';

export default function CreateQuizPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    quiz_type: 'general' as 'general' | 'exam',
    exam_category: EXAM_CATEGORY_OPTIONS[0],
    topic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    question_count: 5,
    language: 'bn' as 'bn' | 'en' | 'mixed',
    entry_cost: 5,
    rake_bps: 0,
    base_pool: minimumBasePool(5, 0),
    generation_instructions: '',
    time_limit_seconds: 300,
    opens_at: '',
    closes_at: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const minBase = minimumBasePool(form.entry_cost, form.rake_bps);
  const thirdPrize = worstCaseThirdPrize(form.base_pool, form.entry_cost, form.rake_bps);
  const perQuestion = perQuestionSeconds(form.time_limit_seconds, form.question_count);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !user?.is_admin)) {
      router.push('/');
    }
  }, [isLoggedIn, isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('শিরোনাম দিন');
      return;
    }
    if (form.topic.trim().length < 3) {
      setError('বিষয় (topic) কমপক্ষে ৩ অক্ষরের হতে হবে');
      return;
    }
    if (form.opens_at && form.closes_at && new Date(form.closes_at) <= new Date(form.opens_at)) {
      setError('শেষ সময় অবশ্যই শুরুর সময়ের পরে হতে হবে');
      return;
    }
    if (Number(form.base_pool) < minBase) {
      setError(`বেস পুল কমপক্ষে ${minBase} কড়ি হতে হবে — নাহলে তৃতীয় স্থানের বিজয়ী প্রবেশ ফি-র চেয়ে কম পাবেন`);
      return;
    }

    setBusy(true);
    try {
      const res = await api.quizzes.admin.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        quiz_type: form.quiz_type,
        exam_category: form.quiz_type === 'exam' ? form.exam_category : null,
        topic: form.topic.trim(),
        difficulty: form.difficulty,
        entry_cost: Number(form.entry_cost),
        rake_bps: Number(form.rake_bps),
        base_pool: Number(form.base_pool),
        generation_instructions: form.generation_instructions.trim() || null,
        question_count: Number(form.question_count),
        language: form.language,
        opens_at: fromDatetimeLocal(form.opens_at),
        closes_at: fromDatetimeLocal(form.closes_at),
        time_limit_seconds: Number(form.time_limit_seconds) > 0 ? Number(form.time_limit_seconds) : null,
      });
      if (res?.success) {
        router.push(`/admin/quizzes/${res.data.quiz.id}`);
      } else {
        setError(res?.error || 'রাউন্ড তৈরি করা যায়নি');
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'রাউন্ড তৈরি করা যায়নি';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !user?.is_admin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin inline-block" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/admin/quizzes"
        className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-medium bengali-text mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> কুইজ তালিকায় ফিরুন
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary-100 text-primary-700 rounded-xl p-2.5">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 bengali-text">নতুন রাউন্ড</h1>
            <p className="text-sm text-gray-600 bengali-text">
              ধরন ও বিষয় দিন — AI সেই অনুযায়ী প্রশ্ন লিখবে। পরে হাতে সম্পাদনা করা যাবে।
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="শিরোনাম">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="যেমন: রবীন্দ্রনাথ ঠাকুর — সাপ্তাহিক রাউন্ড"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
            />
          </Field>

          <Field label="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="খেলোয়াড়রা কী আশা করতে পারেন তা সংক্ষেপে লিখুন"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
            />
          </Field>

          {/* Round type */}
          <Field label="রাউন্ডের ধরন">
            <div className="grid grid-cols-2 gap-3">
              <TypeRadio
                checked={form.quiz_type === 'general'}
                onChange={() => setForm({ ...form, quiz_type: 'general' })}
                title="সাধারণ"
                subtitle="সাহিত্যবিষয়ক সাধারণ জ্ঞান"
                icon={<Sparkles className="w-4 h-4" />}
              />
              <TypeRadio
                checked={form.quiz_type === 'exam'}
                onChange={() => setForm({ ...form, quiz_type: 'exam' })}
                title="পরীক্ষা"
                subtitle="নিয়োগ পরীক্ষার ধাঁচে"
                icon={<GraduationCap className="w-4 h-4" />}
              />
            </div>
          </Field>

          {form.quiz_type === 'exam' && (
            <Field label="পরীক্ষার বিভাগ">
              <select
                value={form.exam_category}
                onChange={(e) => setForm({ ...form, exam_category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
              >
                {EXAM_CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="বিষয় (topic) — এই বিষয়ে প্রশ্ন তৈরি হবে">
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              required
              placeholder="যেমন: বাংলা সাহিত্যের মধ্যযুগ, কাজী নজরুল ইসলামের কবিতা"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
            />
          </Field>

          <Field label="অতিরিক্ত নির্দেশনা (ঐচ্ছিক) — কী রাখতে হবে, কী বাদ দিতে হবে">
            <textarea
              value={form.generation_instructions}
              onChange={(e) => setForm({ ...form, generation_instructions: e.target.value })}
              rows={4}
              placeholder={
                'যেমন: শুধু ১৯৪৭-পরবর্তী কবিতা থেকে প্রশ্ন করুন। ' +
                'নজরুলের গান বাদ দিন। প্রতিটি প্রশ্নে প্রকাশের সাল উল্লেখ করুন।'
              }
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
            />
            <p className="text-xs text-gray-500 bengali-text mt-1">
              এই নির্দেশনা সংরক্ষিত থাকবে — পরে &ldquo;আরও প্রশ্ন তৈরি&rdquo; করলেও একই নিয়ম মানা হবে।
            </p>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="কঠিনতা">
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
              >
                <option value="easy">সহজ</option>
                <option value="medium">মাঝারি</option>
                <option value="hard">কঠিন</option>
              </select>
            </Field>
            <Field label="প্রশ্নসংখ্যা">
              <input
                type="number"
                min={1}
                value={form.question_count}
                onChange={(e) => setForm({ ...form, question_count: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
              />
            </Field>
            <Field label="ভাষা">
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
              >
                <option value="bn">বাংলা</option>
                <option value="en">English</option>
                <option value="mixed">মিশ্র (বাংলা + English)</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="প্রবেশ ফি (কড়ি)">
              <div className="relative">
                <Coins className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-yellow-700" />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.entry_cost}
                  onChange={(e) => {
                    const entry_cost = Number(e.target.value);
                    setForm((f) => ({
                      ...f,
                      entry_cost,
                      base_pool: Math.max(f.base_pool, minimumBasePool(entry_cost, f.rake_bps)),
                    }));
                  }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
                />
              </div>
            </Field>
            <Field label="হাউস কাট (bps, ১০০ = ১%)">
              <input
                type="number"
                min={0}
                max={10000}
                step={50}
                value={form.rake_bps}
                onChange={(e) => {
                  const rake_bps = Number(e.target.value);
                  setForm((f) => ({
                    ...f,
                    rake_bps,
                    base_pool: Math.max(f.base_pool, minimumBasePool(f.entry_cost, rake_bps)),
                  }));
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
              />
            </Field>
            <Field label="সময়সীমা (সেকেন্ড) — ০ হলে সীমা নেই">
              <input
                type="number"
                min={0}
                max={3600}
                step={10}
                value={form.time_limit_seconds}
                onChange={(e) => setForm({ ...form, time_limit_seconds: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
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
                value={form.base_pool}
                onChange={(e) => setForm({ ...form, base_pool: Number(e.target.value) })}
                className={`w-full pl-9 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text ${
                  form.base_pool < minBase ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
          </Field>

          {/* Economics preview — the worst case is exactly three entrants who
              all finish, i.e. the smallest pool that still splits three ways. */}
          <div
            className={`rounded-xl border px-4 py-3 text-sm bengali-text ${
              form.base_pool < minBase
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                সর্বনিম্ন বেস পুল: <strong>{minBase}</strong> কড়ি
              </span>
              <span>
                সবচেয়ে খারাপ ক্ষেত্রে (৩ জন অংশগ্রহণকারী) তৃতীয় স্থান পাবে:{' '}
                <strong>{thirdPrize.toFixed(2)}</strong> কড়ি
              </span>
            </div>
            <p className="mt-1 text-xs">
              {form.base_pool < minBase
                ? 'এই বেস পুলে তৃতীয় স্থানের বিজয়ী প্রবেশ ফি-র চেয়ে কম পাবেন — রাউন্ড প্রকাশ করা যাবে না।'
                : `প্রবেশ ফি ${form.entry_cost} কড়ির বিপরীতে তৃতীয় স্থানও লাভে থাকবে। হাউস কাট শুধু প্রবেশ ফি-র উপর বসে, বেস পুলে নয়।`}
            </p>
          </div>

          {perQuestion !== null && (
            <p className="text-xs text-gray-600 bengali-text -mt-2">
              মোট সময় প্রতিটি প্রশ্নে ভাগ হবে — প্রশ্নপ্রতি প্রায় <strong>{perQuestion}</strong> সেকেন্ড।
              সময় শেষ হলে উত্তর লক হয়ে পরের প্রশ্নে চলে যাবে, আগের প্রশ্নে ফেরা যাবে না।
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="রাউন্ড শুরুর সময়">
              <input
                type="datetime-local"
                value={form.opens_at}
                onChange={(e) => setForm({ ...form, opens_at: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
              />
            </Field>
            <Field label="রাউন্ড শেষের সময় (বিজয়ী চূড়ান্ত হবে)">
              <input
                type="datetime-local"
                value={form.closes_at}
                onChange={(e) => setForm({ ...form, closes_at: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
              />
            </Field>
          </div>
          <p className="text-xs text-gray-500 bengali-text -mt-2">
            প্রকাশ করার আগে শেষের সময় অবশ্যই দিতে হবে — না দিলে রাউন্ড কখনো চূড়ান্ত হবে না।
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 bengali-text">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/quizzes"
              className="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium bengali-text"
            >
              বাতিল
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold bengali-text inline-flex items-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {busy ? 'AI প্রশ্ন তৈরি করছে...' : 'রাউন্ড তৈরি করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TypeRadio({
  checked,
  onChange,
  title,
  subtitle,
  icon,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <label
      className={`cursor-pointer rounded-xl border px-4 py-3 flex items-start gap-3 transition-colors ${
        checked ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
      }`}
    >
      <input type="radio" checked={checked} onChange={onChange} className="mt-1 accent-primary-600" />
      <span>
        <span className="font-semibold text-gray-900 bengali-text inline-flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        <span className="block text-xs text-gray-600 bengali-text mt-0.5">{subtitle}</span>
      </span>
    </label>
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
