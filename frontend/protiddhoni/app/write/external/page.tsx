/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
'use client';

/**
 * Add External Writing
 *
 * A standalone form for cataloguing work an author published somewhere else
 * (Facebook, a personal blog, a magazine site). Deliberately NOT part of the
 * editor flow — nothing is being written here, only described and linked.
 *
 * The result is a normal content row with content_type 'link'. It gets its own
 * reader page like any other article; the excerpt stands in for the body and a
 * prominent button sends the reader to the original.
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Link2, Image as ImageIcon, X, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { uploadCoverImage } from '@/lib/imageUpload';
import ImageCropper from '@/components/editor/ImageCropper';
import { cn } from '@/lib/utils';

// Accept only absolute http(s) URLs. Anything else (javascript:, data:, …) is
// rejected here as well as server-side.
const isValidExternalUrl = (value: string): boolean => {
    if (!value || !value.trim()) return false;
    try {
        const parsed = new URL(value.trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

export default function AddExternalWritingPage() {
    const router = useRouter();
    const { isLoggedIn, isLoading: authLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [categories, setCategories] = useState<any[]>([]);
    const [form, setForm] = useState({
        title: '',
        excerpt: '',
        externalUrl: '',
        categoryId: '',
    });
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>('');
    const [cropperImage, setCropperImage] = useState<string | null>(null);
    const [cropperFileName, setCropperFileName] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) router.push('/login?redirect=/write/external');
    }, [authLoading, isLoggedIn]);

    useEffect(() => {
        api.categories.getAll()
            .then((res: any) => { if (res.success) setCategories(res.data || []); })
            .catch(() => setCategories([]));
    }, []);

    const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, cover: 'ছবি ফাইল নির্বাচন করুন।' }));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, cover: 'ছবির আকার ৫ মেগাবাইটের কম হতে হবে।' }));
            return;
        }
        setErrors(prev => ({ ...prev, cover: '' }));
        const reader = new FileReader();
        reader.onload = () => {
            setCropperImage(reader.result as string);
            setCropperFileName(file.name);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropDone = (cropped: File) => {
        setCoverFile(cropped);
        const reader = new FileReader();
        reader.onload = () => setCoverPreview(reader.result as string);
        reader.readAsDataURL(cropped);
        setCropperImage(null);
    };

    const validate = () => {
        const next: Record<string, string> = {};
        const title = form.title.trim();
        const excerpt = form.excerpt.trim();
        const url = form.externalUrl.trim();

        if (title.length < 3) next.title = 'শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে।';
        else if (title.length > 200) next.title = 'শিরোনাম ২০০ অক্ষরের বেশি হতে পারবে না।';

        if (excerpt.length < 10) next.excerpt = 'সারাংশ কমপক্ষে ১০ অক্ষরের হতে হবে।';
        else if (excerpt.length > 500) next.excerpt = 'সারাংশ ৫০০ অক্ষরের বেশি হতে পারবে না।';

        if (!url) next.externalUrl = 'লেখাটির লিংক দিন।';
        else if (!isValidExternalUrl(url)) next.externalUrl = 'সঠিক লিংক দিন — http:// বা https:// দিয়ে শুরু হতে হবে।';

        if (!form.categoryId) next.categoryId = 'একটি বিভাগ নির্বাচন করুন।';

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            let coverUrl: string | undefined;
            if (coverFile) {
                const uploaded = await uploadCoverImage(coverFile);
                if (!uploaded.success || !uploaded.url) {
                    setErrors({ cover: uploaded.error || 'ছবি আপলোড ব্যর্থ হয়েছে।' });
                    setSubmitting(false);
                    return;
                }
                coverUrl = uploaded.url;
            }

            const created = await api.content.create({
                title: form.title.trim(),
                excerpt: form.excerpt.trim(),
                // A link post has no body of its own; the excerpt carries it.
                body: null,
                content_type: 'link',
                external_url: form.externalUrl.trim(),
                category_id: form.categoryId,
                cover_image_url: coverUrl,
            });

            if (!created.success) {
                setErrors({ submit: created.error || 'সংরক্ষণ ব্যর্থ হয়েছে।' });
                setSubmitting(false);
                return;
            }

            // Same review path as any other submission.
            await api.content.submitForReview(created.data.id);
            setSubmitted(true);
        } catch (err: any) {
            setErrors({ submit: err?.message || 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।' });
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <ExternalLink className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 bengali-text">জমা হয়েছে!</h2>
                    <p className="text-gray-600 mb-8 bengali-text">
                        আপনার বাইরের লেখাটি পর্যালোচনার জন্য পাঠানো হয়েছে। অনুমোদনের পর এটি আপনার প্রোফাইলে দেখা যাবে।
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push('/my-stories')}
                            className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium bengali-text transition-colors"
                        >
                            আমার লেখাগুলো দেখুন
                        </button>
                        <button
                            onClick={() => {
                                setForm({ title: '', excerpt: '', externalUrl: '', categoryId: '' });
                                setCoverFile(null);
                                setCoverPreview('');
                                setErrors({});
                                setSubmitted(false);
                            }}
                            className="w-full px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium bengali-text transition-colors"
                        >
                            আরেকটি যোগ করুন
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <Link href="/write" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="bengali-text">লেখার পাতায় ফিরুন</span>
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-8">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Link2 className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 bengali-text">বাইরের লেখা যোগ করুন</h1>
                            <p className="text-sm text-gray-500 mt-1 bengali-text">
                                ফেসবুক, ব্লগ বা অন্য কোথাও প্রকাশিত আপনার লেখা এখানে যুক্ত করুন — সব লেখা এক জায়গায় থাকবে।
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Cover image */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium bengali-text">কভার ছবি</label>
                            {coverPreview ? (
                                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                    <img src={coverPreview} alt="" className="w-full h-48 object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setCoverFile(null); setCoverPreview(''); }}
                                        className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-40 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                    <ImageIcon className="w-8 h-8" />
                                    <span className="text-sm bengali-text">ছবি নির্বাচন করুন (ঐচ্ছিক)</span>
                                </button>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFilePick} className="hidden" />
                            {errors.cover && <p className="text-sm text-red-500 bengali-text">{errors.cover}</p>}
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium bengali-text">
                                শিরোনাম <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="লেখার শিরোনাম"
                                className={cn(
                                    "w-full px-4 py-3 rounded-xl border bg-gray-50 bengali-text",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                    errors.title ? "border-red-500" : "border-gray-200"
                                )}
                            />
                            {errors.title && <p className="text-sm text-red-500 bengali-text">{errors.title}</p>}
                        </div>

                        {/* External URL */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2 bengali-text">
                                <Link2 className="w-4 h-4" />
                                মূল লেখার লিংক <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                inputMode="url"
                                value={form.externalUrl}
                                onChange={(e) => setForm(p => ({ ...p, externalUrl: e.target.value }))}
                                placeholder="https://example.com/your-writing"
                                className={cn(
                                    "w-full px-4 py-3 rounded-xl border bg-gray-50",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                    errors.externalUrl ? "border-red-500" : "border-gray-200"
                                )}
                            />
                            {errors.externalUrl
                                ? <p className="text-sm text-red-500 bengali-text">{errors.externalUrl}</p>
                                : <p className="text-xs text-gray-400 bengali-text">পাঠক আপনার লেখার পাতায় এসে এই লিংকে যাওয়ার বোতাম দেখতে পাবেন।</p>}
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium bengali-text">
                                বিভাগ <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.categoryId}
                                onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
                                className={cn(
                                    "w-full px-4 py-3 rounded-xl border bg-gray-50 bengali-text",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                    errors.categoryId ? "border-red-500" : "border-gray-200"
                                )}
                            >
                                <option value="">বিভাগ নির্বাচন করুন</option>
                                {categories.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.categoryId && <p className="text-sm text-red-500 bengali-text">{errors.categoryId}</p>}
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium bengali-text">
                                সারাংশ <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={5}
                                value={form.excerpt}
                                onChange={(e) => setForm(p => ({ ...p, excerpt: e.target.value }))}
                                placeholder="লেখাটি কী নিয়ে, সংক্ষেপে লিখুন। পাঠক এটিই পড়বেন।"
                                className={cn(
                                    "w-full px-4 py-3 rounded-xl border bg-gray-50 bengali-text resize-none",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                    errors.excerpt ? "border-red-500" : "border-gray-200"
                                )}
                            />
                            <div className="flex justify-between">
                                {errors.excerpt
                                    ? <p className="text-sm text-red-500 bengali-text">{errors.excerpt}</p>
                                    : <p className="text-xs text-gray-400 bengali-text">এটিই লেখার পাতায় মূল লেখার জায়গায় দেখানো হবে।</p>}
                                <span className="text-xs text-gray-400">{form.excerpt.trim().length}/500</span>
                            </div>
                        </div>

                        {errors.submit && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-sm text-red-600 bengali-text">{errors.submit}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => router.push('/write')}
                                className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium bengali-text transition-colors"
                            >
                                বাতিল
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-5 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-medium bengali-text transition-colors flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> জমা হচ্ছে…</>
                                ) : (
                                    'পর্যালোচনার জন্য জমা দিন'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {cropperImage && (
                <ImageCropper
                    image={cropperImage}
                    originalFileName={cropperFileName}
                    onCropComplete={handleCropDone}
                    onCancel={() => setCropperImage(null)}
                />
            )}
        </div>
    );
}
