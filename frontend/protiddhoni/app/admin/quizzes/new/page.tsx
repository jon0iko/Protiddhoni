'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Brain, Coins, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function CreateQuizPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    source_material: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    entry_cost: 5,
    reward_per_correct: 2,
    question_count: 5,
    language: 'bn' as 'bn' | 'en',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (form.source_material.trim().length < 80) {
      setError('পাঠ্য উপাদান কমপক্ষে ৮০ অক্ষরের হওয়া উচিত');
      return;
    }

    setBusy(true);
    try {
      const res = await api.quizzes.admin.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        source_material: form.source_material,
        difficulty: form.difficulty,
        entry_cost: Number(form.entry_cost),
        reward_per_correct: Number(form.reward_per_correct),
        question_count: Number(form.question_count),
        language: form.language,
      });
      if (res?.success) {
        router.push(`/admin/quizzes/${res.data.quiz.id}`);
      } else {
        setError(res?.error || 'কুইজ তৈরি করা যায়নি');
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'কুইজ তৈরি করা যায়নি';
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
            <h1 className="text-2xl font-bold text-gray-900 bengali-text">নতুন কুইজ</h1>
            <p className="text-sm text-gray-600 bengali-text">
              উপাদান দিন, Gemini মাল্টিপল চয়েস প্রশ্ন তৈরি করবে।
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
              placeholder="যেমন: রবীন্দ্রনাথ ঠাকুরের জীবন ও কর্ম"
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

          <Field label="পাঠ্য উপাদান (Gemini এই অনুচ্ছেদ থেকে প্রশ্ন বানাবে)">
            <textarea
              value={form.source_material}
              onChange={(e) => setForm({ ...form, source_material: e.target.value })}
              rows={10}
              required
              placeholder="যে বিষয়ের ওপর কুইজ তৈরি হবে তার সম্পূর্ণ বর্ণনা দিন। যত বিস্তৃত হবে, প্রশ্ন তত নির্ভুল।"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
            />
            <p className="text-xs text-gray-500 mt-1 bengali-text">
              কমপক্ষে ৮০ অক্ষর — বর্তমান: {form.source_material.length}
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
                max={15}
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
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="প্রবেশ ফি (কড়ি)">
              <div className="relative">
                <Coins className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-yellow-700" />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.entry_cost}
                  onChange={(e) => setForm({ ...form, entry_cost: Number(e.target.value) })}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
                />
              </div>
            </Field>
            <Field label="প্রতি সঠিক উত্তরের পুরস্কার (কড়ি)">
              <div className="relative">
                <Sparkles className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.reward_per_correct}
                  onChange={(e) => setForm({ ...form, reward_per_correct: Number(e.target.value) })}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
                />
              </div>
            </Field>
          </div>

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
              {busy ? 'AI প্রশ্ন তৈরি করছে...' : 'প্রশ্ন তৈরি করুন'}
            </button>
          </div>
        </form>
      </div>
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
