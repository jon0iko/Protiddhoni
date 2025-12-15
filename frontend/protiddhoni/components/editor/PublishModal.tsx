'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle, 
  Check,
  BookOpen,
  Feather,
  FileText,
  ChevronDown
} from 'lucide-react';
import { cn, validateImageFile, fileToBase64, getExcerptFromHtml } from '@/lib/utils';
import { api } from '@/lib/api';
import type { PublishFormData, PublishFormErrors, Category, Series } from './types';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onPublishSuccess: () => void;
}

const CONTENT_TYPES = [
  { id: 'story', name: 'গল্প', icon: BookOpen, description: 'ছোটগল্প বা উপন্যাস' },
  { id: 'poem', name: 'কবিতা', icon: Feather, description: 'ছন্দ ও কবিতা' },
  { id: 'chapter', name: 'পর্ব', icon: FileText, description: 'ধারাবাহিক সিরিজের অংশ' },
] as const;

export default function PublishModal({
  isOpen,
  onClose,
  content,
  onPublishSuccess,
}: PublishModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<PublishFormData>({
    title: '',
    excerpt: '',
    contentType: 'story',
    categoryId: '',
    seriesId: undefined,
    chapterNumber: undefined,
    isPremium: false,
    coverImage: null,
    coverImagePreview: null,
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<PublishFormErrors>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [userSeries, setUserSeries] = useState<Series[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load categories and user's series
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setIsLoadingData(true);
    try {
      const categoriesResponse = await api.categories.getAll();
      setCategories(categoriesResponse.data || []);
      
      // TODO: Load user's series when that API is available
      // For now, we'll leave series empty
      setUserSeries([]);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setErrors(prev => ({
        ...prev,
        general: 'ডেটা লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
      }));
    } finally {
      setIsLoadingData(false);
    }
  };

  // Auto-generate excerpt from content
  useEffect(() => {
    if (content && !formData.excerpt) {
      const autoExcerpt = getExcerptFromHtml(content, 200);
      setFormData(prev => ({ ...prev, excerpt: autoExcerpt }));
    }
  }, [content, formData.excerpt]);

  // Handle image selection
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, coverImage: validation.error }));
      return;
    }

    setErrors(prev => ({ ...prev, coverImage: undefined }));

    // Generate preview
    const preview = await fileToBase64(file);
    setFormData(prev => ({
      ...prev,
      coverImage: file,
      coverImagePreview: preview,
    }));
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: PublishFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'শিরোনাম দিন';
    } else if (formData.title.length < 3) {
      newErrors.title = 'শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে';
    } else if (formData.title.length > 200) {
      newErrors.title = 'শিরোনাম ২০০ অক্ষরের বেশি হতে পারবে না';
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'সারাংশ দিন';
    } else if (formData.excerpt.length < 10) {
      newErrors.excerpt = 'সারাংশ কমপক্ষে ১০ অক্ষরের হতে হবে';
    } else if (formData.excerpt.length > 500) {
      newErrors.excerpt = 'সারাংশ ৫০০ অক্ষরের বেশি হতে পারবে না';
    }

    if (!formData.categoryId) {
      newErrors.category = 'বিভাগ নির্বাচন করুন';
    }

    if (formData.contentType === 'chapter') {
      if (!formData.seriesId) {
        newErrors.series = 'সিরিজ নির্বাচন করুন';
      }
      if (!formData.chapterNumber || formData.chapterNumber < 1) {
        newErrors.chapterNumber = 'পর্ব নম্বর দিন';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('লগইন করুন');

      // Create content data
      const contentData = {
        title: formData.title.trim(),
        body: content,
        excerpt: formData.excerpt.trim(),
        content_type: formData.contentType,
        category_id: formData.categoryId,
        series_id: formData.contentType === 'chapter' ? formData.seriesId : undefined,
        chapter_number: formData.contentType === 'chapter' ? formData.chapterNumber : undefined,
        is_premium: formData.isPremium,
        cover_image_url: formData.coverImagePreview || undefined, // In production, upload to storage first
      };

      // Create the content
      const response = await api.content.create(contentData, token);
      
      // Submit for review
      await api.content.submitForReview(response.data.id, token);

      // Success!
      setShowSuccess(true);

      // Close modal after showing success
      setTimeout(() => {
        setShowSuccess(false);
        onPublishSuccess();
        onClose();
      }, 2500);
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'প্রকাশ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        excerpt: '',
        contentType: 'story',
        categoryId: '',
        seriesId: undefined,
        chapterNumber: undefined,
        isPremium: false,
        coverImage: null,
        coverImagePreview: null,
      });
      setErrors({});
      setShowSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <h2 className="text-xl font-semibold bengali-text">লেখা প্রকাশ করুন</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-6">
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-500 bengali-text">লোড হচ্ছে...</span>
            </div>
          ) : showSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 bengali-text">লেখা জমা দেওয়া হয়েছে!</h3>
              <p className="text-gray-500 bengali-text">
                আপনার লেখা পর্যালোচনার জন্য পাঠানো হয়েছে। অনুমোদন হলে প্রকাশিত হবে।
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error */}
              {errors.general && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400 bengali-text">{errors.general}</p>
                </div>
              )}

              {/* Content Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 bengali-text">
                  লেখার ধরন <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {CONTENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, contentType: type.id as 'story' | 'poem' | 'chapter' }))}
                        className={cn(
                          "flex flex-col items-center p-4 rounded-xl border-2 transition-all",
                          formData.contentType === type.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        <Icon className={cn(
                          "h-6 w-6 mb-2",
                          formData.contentType === type.id ? "text-blue-600" : "text-gray-400"
                        )} />
                        <span className={cn(
                          "font-medium bengali-text",
                          formData.contentType === type.id ? "text-blue-600" : "text-gray-600 dark:text-gray-300"
                        )}>{type.name}</span>
                        <span className="text-xs text-gray-400 bengali-text">{type.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium bengali-text">
                  শিরোনাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="আপনার লেখার শিরোনাম..."
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 bengali-text",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    errors.title ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                  )}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 bengali-text">{errors.title}</p>
                )}
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <label className="text-sm font-medium bengali-text">
                  সারাংশ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="লেখার সংক্ষিপ্ত বিবরণ..."
                  rows={3}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 bengali-text resize-none",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    errors.excerpt ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                  )}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="bengali-text">{errors.excerpt || ''}</span>
                  <span>{formData.excerpt.length}/500</span>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium bengali-text">
                  বিভাগ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 bengali-text appearance-none",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                      errors.category ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.category && (
                  <p className="text-sm text-red-500 bengali-text">{errors.category}</p>
                )}
              </div>

              {/* Series Selection (only for chapters) */}
              {formData.contentType === 'chapter' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium bengali-text">
                      সিরিজ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.seriesId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, seriesId: e.target.value || undefined }))}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800 bengali-text appearance-none",
                          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                          errors.series ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                        )}
                      >
                        <option value="">সিরিজ নির্বাচন করুন</option>
                        {userSeries.map((series) => (
                          <option key={series.id} value={series.id}>{series.title}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.series && (
                      <p className="text-sm text-red-500 bengali-text">{errors.series}</p>
                    )}
                    {userSeries.length === 0 && (
                      <p className="text-sm text-amber-600 bengali-text">আপনার কোন সিরিজ নেই। প্রথমে একটি সিরিজ তৈরি করুন।</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium bengali-text">
                      পর্ব নম্বর <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.chapterNumber || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, chapterNumber: parseInt(e.target.value) || undefined }))}
                      placeholder="১, ২, ৩..."
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-800",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                        errors.chapterNumber ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                      )}
                    />
                    {errors.chapterNumber && (
                      <p className="text-sm text-red-500 bengali-text">{errors.chapterNumber}</p>
                    )}
                  </div>
                </>
              )}

              {/* Cover Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 bengali-text">
                  <ImageIcon className="h-4 w-4" />
                  কভার ছবি (ঐচ্ছিক)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative cursor-pointer border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden",
                    formData.coverImagePreview
                      ? "border-blue-500/50 bg-blue-50 dark:bg-blue-900/10"
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                    errors.coverImage && "border-red-500"
                  )}
                >
                  {formData.coverImagePreview ? (
                    <div className="relative aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.coverImagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium bengali-text">
                          ছবি পরিবর্তন করুন
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-6">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-300 font-medium bengali-text">
                        ছবি আপলোড করুন
                      </span>
                      <span className="text-xs text-gray-400 mt-1 bengali-text">
                        JPEG, PNG, GIF, বা WebP (সর্বোচ্চ ৫MB)
                      </span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {errors.coverImage && (
                  <p className="text-sm text-red-500 bengali-text">{errors.coverImage}</p>
                )}
              </div>

              {/* Premium Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div>
                  <h4 className="font-medium bengali-text">প্রিমিয়াম কন্টেন্ট</h4>
                  <p className="text-sm text-gray-500 bengali-text">শুধুমাত্র সাবস্ক্রাইবারদের জন্য</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isPremium: !prev.isPremium }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    formData.isPremium ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      formData.isPremium ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bengali-text disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 bengali-text disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      জমা দেওয়া হচ্ছে...
                    </>
                  ) : (
                    'পর্যালোচনার জন্য জমা দিন'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
