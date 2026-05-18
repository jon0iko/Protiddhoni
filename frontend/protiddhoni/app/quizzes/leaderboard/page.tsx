/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Coins, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { toBengaliNumber } from '@/lib/numberFormatter';
import type { QuizLeaderboardEntry } from '@/types';

export default function GlobalLeaderboardPage() {
  const [entries, setEntries] = useState<QuizLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.quizzes.globalLeaderboard(50);
        if (res?.success) setEntries(res.data || []);
        else setError(res?.error || 'লিডারবোর্ড লোড করা যায়নি');
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'লিডারবোর্ড লোড করা যায়নি');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/quizzes"
        className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-medium bengali-text mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> কুইজ তালিকায় ফিরুন
      </Link>

      <div className="bg-gradient-to-r from-primary-600 to-accent-500 rounded-3xl text-white p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8" />
          <h1 className="text-3xl font-bold bengali-text">বৈশ্বিক লিডারবোর্ড</h1>
        </div>
        <p className="mt-2 text-white/90 bengali-text">
          সব কুইজ একত্রে — যিনি সবচেয়ে বেশি সঠিক উত্তর দিচ্ছেন, যিনি সবচেয়ে বেশি কড়ি জিতছেন।
        </p>
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin inline-block" />
          </div>
        ) : error ? (
          <div className="py-10 text-center text-red-600 bengali-text">{error}</div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center bengali-text text-gray-500">
            <Sparkles className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            এখনও কেউ কুইজ শেষ করেনি — আপনিই হোন প্রথম!
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-left">
              <tr className="text-gray-600 bengali-text">
                <th className="px-4 py-3">র‌্যাঙ্ক</th>
                <th className="px-4 py-3">খেলোয়াড়</th>
                <th className="px-4 py-3 text-right">মোট স্কোর</th>
                <th className="px-4 py-3 text-right">সঠিক উত্তর</th>
                <th className="px-4 py-3 text-right">কুইজ খেলা</th>
                <th className="px-4 py-3 text-right">কড়ি অর্জন</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.user?.id ?? entry.rank} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          entry.user?.profile_picture_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.user?.username}`
                        }
                        alt={entry.user?.full_name || entry.user?.username || ''}
                        className="w-9 h-9 rounded-full bg-gray-100"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate bengali-text">
                          {entry.user?.full_name || entry.user?.username || 'অজানা'}
                        </p>
                        {entry.user?.username && (
                          <p className="text-xs text-gray-500">@{entry.user.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary-700 bengali-text">
                    {toBengaliNumber(entry.totalScore)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 bengali-text">
                    {toBengaliNumber(entry.totalCorrect)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 bengali-text">
                    {toBengaliNumber(entry.gamesPlayed)}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-700 font-medium">
                    <span className="inline-flex items-center gap-1 bengali-text">
                      <Coins className="w-4 h-4" />
                      {toBengaliNumber(Math.round(entry.totalKori))}
                    </span>
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
    <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm bengali-text ${medal}`}>
      {toBengaliNumber(rank)}
    </span>
  );
}
