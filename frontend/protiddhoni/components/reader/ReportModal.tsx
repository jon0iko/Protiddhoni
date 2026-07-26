/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentTitle: string;
}

const REPORT_CATEGORIES = [
  { id: 'spam', label: 'স্প্যাম বা বিজ্ঞাপন', desc: 'অবাঞ্ছিত প্রচার বা অপ্রাসঙ্গিক লিঙ্ক' },
  { id: 'inappropriate', label: 'আপত্তিকর বা অশ্লীল উপাদান', desc: 'অশালীন ভাষা বা প্রাপ্তবয়স্কদের বিষয়বস্তু' },
  { id: 'copyright', label: 'কপিরাইট বা চুরিকৃত লেখা', desc: 'অন্য কারো লেখা অনুমতি ছাড়া প্রকাশ করা হয়েছে' },
  { id: 'hate_speech', label: 'ঘৃণামূলক বা আক্রমণাত্মক বক্তব্য', desc: 'ধর্ম, বর্ণ, বা লিঙ্গভিত্তিক বিদ্বেষমূলক বক্তব্য' },
  { id: 'misinformation', label: 'ভুল বা বিভ্রান্তিকর তথ্য', desc: 'ইচ্ছাকৃতভাবে ভুল বা ক্ষতিকর তথ্য প্রদান' },
  { id: 'other', label: 'অন্যান্য কারণ', desc: 'উপরে উল্লেখিত নয় এমন অন্য কোনো সমস্যা' },
];

export default function ReportModal({ isOpen, onClose, contentId, contentTitle }: ReportModalProps) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string>('spam');
  const [details, setDetails] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.reports.create({
        content_id: contentId,
        reason_category: selectedCategory,
        reason_details: details.trim() || undefined,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(res.error || 'অভিযোগ জমা দেওয়া সম্ভব হয়নি');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'অভিযোগ জমা দেওয়া সম্ভব হয়নি');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory('spam');
    setDetails('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent-600" />
            <h3 className="text-base font-bold text-gray-900 bengali-text">অভিযোগ করুন</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-10 px-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h4 className="text-lg font-bold text-gray-900 bengali-text">ধন্যবাদ!</h4>
            <p className="text-sm text-gray-500 bengali-text">
              আপনার অভিযোগটি সফলভাবে জমা দেওয়া হয়েছে। আমাদের মডারেশন দল এটি পর্যালোচনা করবে।
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {/* Content reference */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 bengali-text">
              <span className="font-medium text-gray-700">রচনা: </span>
              {contentTitle}
            </div>

            {/* Categories */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 bengali-text uppercase tracking-wide">
                অভিযোগের ধরন বেছে নিন
              </p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                {REPORT_CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedCategory === cat.id
                        ? 'border-accent-400 bg-accent-50/60'
                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_category"
                      value={cat.id}
                      checked={selectedCategory === cat.id}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mt-0.5 accent-accent-600"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 bengali-text leading-snug">{cat.label}</div>
                      <div className="text-xs text-gray-400 bengali-text mt-0.5">{cat.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block bengali-text uppercase tracking-wide">
                বিস্তারিত বিবরণ <span className="font-normal text-gray-400 normal-case">(ঐচ্ছিক)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="সমস্যাটি সম্পর্কে আরও বিস্তারিত জানান..."
                rows={3}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm bengali-text text-gray-900 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-accent-50 border border-accent-200 text-accent-700 px-3.5 py-2.5 rounded-lg text-sm bengali-text">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors bengali-text"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 bengali-text"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    জমা হচ্ছে...
                  </>
                ) : (
                  'অভিযোগ জমা দিন'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
