'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Coins,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

type ContentItem = {
  id: string;
  title: string;
  slug: string;
  content_type?: string;
  excerpt?: string | null;
  author?: { id: string; username: string; full_name: string };
  category?: { id: string; name: string; slug: string } | null;
};

export default function NewQuizFromContentPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    question_count: 5,
    entry_cost: 5,
    reward_per_correct: 2,
    language: 'bn' as 'bn' | 'en',
  });

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !user?.is_admin)) {
      router.push('/');
    }
  }, [isLoading, isLoggedIn, user, router]);

  // Initial load: recent published content
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.content.getPublished({ limit: 30 });
        if (!cancelled && Array.isArray(res?.data)) setItems(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (user?.is_admin) load();
    return () => {
      cancelled = true;
    };
  }, [user?.is_admin]);

  // Debounced search
  useEffect(() => {
    if (!user?.is_admin) return;
    const q = searchTerm.trim();
    if (q.length < 2) return;
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.content.search({ q, limit: 30 });
        if (!cancelled && Array.isArray(res?.data)) setItems(res.data);
      } catch (err) {
        console.error('Content search error:', err);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, user?.is_admin]);

  const selectedItem = useMemo(
    () => items.find((it) => it.id === selectedId) || null,
    [items, selectedId]
  );

  const handleGenerate = async () => {
    if (!selectedId) {
      setError('একটি কনটেন্ট বেছে নিন');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const res = await api.quizzes.admin.createFromContent(selectedId, {
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
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
      setError(err?.response?.data?.error || err?.message || 'কুইজ তৈরি করা যায়নি');
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading || !user?.is_admin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin inline-block" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        href="/admin/quizzes"
        className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-medium bengali-text"
      >
        <ArrowLeft className="w-4 h-4" /> কুইজ তালিকায় ফিরুন
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary-100 text-primary-700 rounded-xl p-2.5">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 bengali-text">কনটেন্ট থেকে কুইজ</h1>
            <p className="text-sm text-gray-600 bengali-text">
              যেকোনো প্রকাশিত গল্প/অধ্যায়/কবিতা বাছাই করুন — Gemini তার লেখাটি পড়ে প্রশ্ন তৈরি করবে।
            </p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="শিরোনাম, লেখক বা বিষয় দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
          />
          {searching && (
            <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin inline-block" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bengali-text">
            কোনো কনটেন্ট পাওয়া যায়নি।
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto -mx-2 px-2">
            <ul className="space-y-2">
              {items.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 bengali-text">{item.title}</p>
                          <p className="text-xs text-gray-500 bengali-text mt-0.5">
                            {item.author?.full_name ? `লেখক: ${item.author.full_name}` : ''}
                            {item.content_type ? ` · ${item.content_type}` : ''}
                            {item.category?.name ? ` · ${item.category.name}` : ''}
                          </p>
                          {item.excerpt && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1 bengali-text">
                              {item.excerpt}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded-full bengali-text shrink-0">
                            নির্বাচিত
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary-600" />
          <h2 className="font-bold text-gray-900 bengali-text">কুইজ সেটিংস</h2>
        </div>

        {selectedItem && (
          <div className="mb-4 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-sm text-primary-800 bengali-text">
            <span className="font-semibold">উৎস:</span> {selectedItem.title}
            {selectedItem.author?.full_name ? ` (${selectedItem.author.full_name})` : ''}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="শিরোনাম (ঐচ্ছিক — খালি রাখলে স্বয়ংক্রিয় হবে)">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={selectedItem ? `${selectedItem.title} — কুইজ` : ''}
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

        <div className="mt-4">
          <Field label="বিবরণ (ঐচ্ছিক)">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bengali-text"
            />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
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
          <Field label="প্রবেশ ফি">
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
          <Field label="পুরস্কার / সঠিক">
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
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 bengali-text">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <Link
            href="/admin/quizzes/new"
            className="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium bengali-text"
          >
            ম্যানুয়াল উপাদানে যান
          </Link>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !selectedId}
            className="px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold bengali-text inline-flex items-center gap-2 disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'AI প্রশ্ন তৈরি করছে...' : 'কুইজ তৈরি করুন'}
          </button>
        </div>
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
