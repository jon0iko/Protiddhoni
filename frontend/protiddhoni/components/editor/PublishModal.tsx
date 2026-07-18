/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
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
  ChevronDown,
  Edit,
  Link2
} from 'lucide-react';
import { cn, validateImageFile, fileToBase64, getExcerptFromHtml } from '@/lib/utils';
import { uploadCoverImage } from '@/lib/imageUpload';
import { api } from '@/lib/api';
import ImageCropper from './ImageCropper';
import type { PublishFormData, PublishFormErrors, Category, Series } from './types';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onPublishSuccess: () => void;
  initialTitle?: string;
}

const CONTENT_TYPES = [
  { id: 'story', name: 'গদ্য', icon: BookOpen, description: 'ছোটগল্প, উপন্যাস বা প্রবন্ধ' },
  { id: 'poem', name: 'পদ্য', icon: Feather, description: 'ছড়া বা কবিতা' },
  { id: 'chapter', name: 'পর্ব', icon: FileText, description: 'ধারাবাহিক সিরিজের অংশ' },
  { id: 'link', name: 'বাইরের লেখা', icon: Link2, description: 'অন্য প্ল্যাটফর্মে প্রকাশিত লেখার লিংক' },
] as const;

/**
 * Only absolute http/https URLs are accepted. This rejects javascript:, data:
 * and other schemes that would become an XSS vector once the URL is rendered as
 * an <a href> on the content card.
 */
const isValidExternalUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function PublishModal({
  isOpen,
  onClose,
  content,
  onPublishSuccess,
  initialTitle,
}: PublishModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<PublishFormData>({
    title: '',
    excerpt: '',
    contentType: 'story',
    categoryId: '',
    externalUrl: '',
    seriesId: undefined,
    chapterNumber: undefined,
    isPremium: false,
    price: undefined,
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
  const [isCreatingSeries, setIsCreatingSeries] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [newSeriesDescription, setNewSeriesDescription] = useState('');
  const [newSeriesCategoryId, setNewSeriesCategoryId] = useState('');
  const [seriesCreationError, setSeriesCreationError] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [categoryCreationError, setCategoryCreationError] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Image cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);

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
      
      // Load user's series
      try {
        const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
        if (user.id) {
          const seriesResponse = await api.series.getByAuthor(user.id);
          setUserSeries(seriesResponse.data || []);
        }
      } catch (seriesError) {
        console.warn('Failed to load user series:', seriesError);
        setUserSeries([]);
      }
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

    // Generate preview and show cropper
    const preview = await fileToBase64(file);
    setOriginalImage(preview);
    setOriginalImageFile(file);
    setShowCropper(true);
  }, []);

  // Handle crop complete
  const handleCropComplete = useCallback((croppedFile: File) => {
    // Generate preview from cropped file
    fileToBase64(croppedFile).then((preview) => {
      setFormData(prev => ({
        ...prev,
        coverImage: croppedFile,
        coverImagePreview: preview,
      }));
      setShowCropper(false);
    });
  }, []);

  // Handle crop cancel
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setOriginalImage(null);
    setOriginalImageFile(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle re-crop
  const handleReCrop = useCallback(() => {
    if (originalImage) {
      setShowCropper(true);
    }
  }, [originalImage]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: PublishFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'শিরোনাম দিন। এটি আপনার লেখার পরিচয়।';
    } else if (formData.title.length < 3) {
      newErrors.title = `শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে। বর্তমানে ${formData.title.length} অক্ষর।`;
    } else if (formData.title.length > 200) {
      newErrors.title = `শিরোনাম ২০০ অক্ষরের বেশি হতে পারবে না। বর্তমানে ${formData.title.length} অক্ষর।`;
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'সারাংশ দিন। এটি পাঠকদের আকৃষ্ট করবে।';
    } else if (formData.excerpt.length < 10) {
      newErrors.excerpt = `সারাংশ কমপক্ষে ১০ অক্ষরের হতে হবে। বর্তমানে ${formData.excerpt.length} অক্ষর।`;
    } else if (formData.excerpt.length > 500) {
      newErrors.excerpt = `সারাংশ ৫০০ অক্ষরের বেশি হতে পারবে না। বর্তমানে ${formData.excerpt.length} অক্ষর।`;
    }

    if (!formData.categoryId) {
      newErrors.category = 'বিভাগ নির্বাচন করুন। এটি পাঠকদের আপনার লেখা খুঁজে পেতে সাহায্য করবে।';
    }

    if (formData.contentType === 'chapter') {
      if (!formData.seriesId) {
        newErrors.series = 'সিরিজ নির্বাচন করুন বা নতুন সিরিজ তৈরি করুন।';
      }
      if (!formData.chapterNumber || formData.chapterNumber < 1) {
        newErrors.chapterNumber = 'পর্ব নম্বর দিন (১ বা তার বেশি)।';
      }
    }

    if (formData.contentType === 'link') {
      const url = (formData.externalUrl || '').trim();
      if (!url) {
        newErrors.externalUrl = 'লেখাটির লিংক দিন।';
      } else if (!isValidExternalUrl(url)) {
        newErrors.externalUrl = 'সঠিক লিংক দিন। লিংকটি http:// বা https:// দিয়ে শুরু হতে হবে।';
      }
    }

    if (formData.isPremium) {
      if (!formData.price || formData.price <= 0) {
        newErrors.price = 'প্রিমিয়াম কন্টেন্টের জন্য মূল্য নির্ধারণ করুন (০ এর চেয়ে বেশি)।';
      } else if (formData.price > 10000) {
        newErrors.price = `মূল্য ১০,০০০ টাকার বেশি হতে পারবে না। বর্তমানে ${formData.price} টাকা।`;
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

      // Upload cover image first if provided
      let coverImageUrl: string | undefined = undefined;
      
      if (formData.coverImage) {
        const uploadResult = await uploadCoverImage(formData.coverImage);
        
        if (uploadResult.success && uploadResult.url) {
          coverImageUrl = uploadResult.url;
        } else {
          setErrors({
            general: uploadResult.error || 'কভার ছবি আপলোড করতে সমস্যা হয়েছে',
          });
          setIsSubmitting(false);
          return;
        }
      }

      const isLink = formData.contentType === 'link';

      // Create content data
      const contentData = {
        title: formData.title.trim(),
        // A link post has no body of its own — it lives on another platform.
        body: isLink ? null : content,
        excerpt: formData.excerpt.trim(),
        content_type: formData.contentType,
        category_id: formData.categoryId,
        external_url: isLink ? (formData.externalUrl || '').trim() : undefined,
        series_id: formData.contentType === 'chapter' ? formData.seriesId : undefined,
        chapter_number: formData.contentType === 'chapter' ? formData.chapterNumber : undefined,
        is_premium: formData.isPremium,
        price: formData.isPremium && formData.price ? formData.price : undefined,
        cover_image_url: coverImageUrl,
      };

      // Create the content
      const response = await api.content.create(contentData);
      
      // Submit for review
      await api.content.submitForReview(response.data.id);

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
        title: initialTitle || '',
        excerpt: '',
        contentType: 'story',
        categoryId: '',
        externalUrl: '',
        price: undefined,
        seriesId: undefined,
        chapterNumber: undefined,
        isPremium: false,
        coverImage: null,
        coverImagePreview: null,
      });
      setErrors({});
      setShowSuccess(false);
    }
  }, [isOpen, initialTitle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <h2 className="text-xl font-semibold bengali-text">লেখা প্রকাশ করুন</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100:bg-gray-800 transition-colors"
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
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 bengali-text">লেখা জমা দেওয়া হয়েছে!</h3>
              <p className="text-gray-500 bengali-text">
                আপনার লেখা পর্যালোচনার জন্য পাঠানো হয়েছে। অনুমোদন হলে প্রকাশিত হবে।
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* General Error */}
              {errors.general && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 bengali-text">{errors.general}</p>
                </div>
              )}

              {/* Content Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 bengali-text">
                  লেখার ধরন <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CONTENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, contentType: type.id as 'story' | 'poem' | 'chapter' | 'link' }))}
                        className={cn(
                          "flex flex-col items-center p-4 rounded-xl border-2 transition-all",
                          formData.contentType === type.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300:border-gray-600"
                        )}
                      >
                        <Icon className={cn(
                          "h-6 w-6 mb-2",
                          formData.contentType === type.id ? "text-primary-600" : "text-gray-400"
                        )} />
                        <span className={cn(
                          "font-medium bengali-text",
                          formData.contentType === type.id ? "text-primary-600" : "text-gray-600"
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
                    "w-full px-4 py-3 rounded-xl border bg-gray-50 bengali-text",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    errors.title ? "border-red-500" : "border-gray-200"
                  )}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 bengali-text">{errors.title}</p>
                )}
              </div>

              {/* External URL (only for link posts) */}
              {formData.contentType === 'link' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 bengali-text">
                    <Link2 className="h-4 w-4" />
                    লেখাটির লিংক <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    inputMode="url"
                    value={formData.externalUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, externalUrl: e.target.value }))}
                    placeholder="https://example.com/your-writing"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-gray-50",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                      errors.externalUrl ? "border-red-500" : "border-gray-200"
                    )}
                  />
                  {errors.externalUrl ? (
                    <p className="text-sm text-red-500 bengali-text">{errors.externalUrl}</p>
                  ) : (
                    <p className="text-xs text-gray-400 bengali-text">
                      ফেসবুক, ব্লগ বা অন্য যেকোনো সাইটে প্রকাশিত আপনার লেখার সম্পূর্ণ ঠিকানা দিন। পাঠক কার্ডে ক্লিক করলে নতুন ট্যাবে সেখানেই যাবেন।
                    </p>
                  )}
                </div>
              )}

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
                    "w-full px-4 py-3 rounded-xl border bg-gray-50 bengali-text resize-none",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    errors.excerpt ? "border-red-500" : "border-gray-200"
                  )}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="bengali-text">{errors.excerpt || ''}</span>
                  <span>{formData.excerpt.length}/500</span>
                </div>
              </div>

              {/* Category */}
              {!isCreatingCategory ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium bengali-text">
                    বিভাগ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.categoryId}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '__create_new__') {
                          setIsCreatingCategory(true);
                        } else {
                          setFormData(prev => ({ ...prev, categoryId: value }));
                        }
                      }}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-gray-50 bengali-text appearance-none",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                        errors.category ? "border-red-500" : "border-gray-200"
                      )}
                    >
                      <option value="">বিভাগ নির্বাচন করুন</option>
                      <option value="__create_new__" className="font-semibold text-primary-600">+ নতুন বিভাগ তৈরি করুন</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.category && (
                    <p className="text-sm text-red-500 bengali-text">{errors.category}</p>
                  )}
                  {/* Show delete option for selected category */}
                  {formData.categoryId && formData.categoryId !== '__create_new__' && (
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(formData.categoryId)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium bengali-text flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      এই বিভাগটি মুছে ফেলুন
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 bengali-text flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary-600" />
                      নতুন বিভাগ তৈরি করুন
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setNewCategoryName('');
                        setNewCategoryDescription('');
                        setCategoryCreationError('');
                      }}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {categoryCreationError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg bengali-text">
                      <AlertCircle className="h-4 w-4" />
                      {categoryCreationError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium bengali-text">
                      বিভাগের নাম <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="বিভাগের নাম লিখুন"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bengali-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium bengali-text">
                      বিভাগের বিবরণ
                    </label>
                    <textarea
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="এই বিভাগ সম্পর্কে কিছু লিখুন"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bengali-text resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!newCategoryName.trim()) {
                        setCategoryCreationError('বিভাগের নাম দিন');
                        return;
                      }

                      try {
                        setCategoryCreationError('');
                        const response = await api.categories.create({
                          name: newCategoryName,
                          description: newCategoryDescription,
                        });

                        if (response.success && response.data) {
                          // Add to categories list
                          setCategories(prev => [...prev, response.data]);
                          // Select the new category
                          setFormData(prev => ({ ...prev, categoryId: response.data.id }));
                          // Close creation form
                          setIsCreatingCategory(false);
                          setNewCategoryName('');
                          setNewCategoryDescription('');
                        }
                      } catch (error: any) {
                        setCategoryCreationError(error.message || 'বিভাগ তৈরিতে সমস্যা হয়েছে');
                      }
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium bengali-text text-sm"
                  >
                    বিভাগ তৈরি করুন
                  </button>
                </div>
              )}

              {/* Delete Category Confirmation */}
              {categoryToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                  <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setCategoryToDelete(null)}
                  />
                  <div className="relative bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 bengali-text">বিভাগ মুছে ফেলবেন?</h3>
                        <p className="text-gray-600 text-sm bengali-text mb-4">
                          আপনি কি নিশ্চিত যে এই বিভাগটি মুছে ফেলতে চান? এই বিভাগের সাথে কোনো লেখা থাকলে মুছে ফেলা যাবে না।
                        </p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(null)}
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors bengali-text"
                          >
                            বাতিল
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.categories.delete(categoryToDelete);
                                // Remove from categories list
                                setCategories(prev => prev.filter(c => c.id !== categoryToDelete));
                                // Clear selection if this was selected
                                if (formData.categoryId === categoryToDelete) {
                                  setFormData(prev => ({ ...prev, categoryId: '' }));
                                }
                                setCategoryToDelete(null);
                              } catch (error: any) {
                                setCategoryCreationError(error.message || 'বিভাগ মুছতে সমস্যা হয়েছে');
                                setCategoryToDelete(null);
                              }
                            }}
                            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors bengali-text"
                          >
                            মুছে ফেলুন
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Series Selection (only for chapters) */}
              {formData.contentType === 'chapter' && (
                <>
                  {!isCreatingSeries ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium bengali-text">
                        সিরিজ <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.seriesId || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '__create_new__') {
                              setIsCreatingSeries(true);
                              setNewSeriesCategoryId(formData.categoryId);
                            } else {
                              setFormData(prev => ({ ...prev, seriesId: value || undefined }));
                            }
                          }}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border bg-gray-50 bengali-text appearance-none",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                            errors.series ? "border-red-500" : "border-gray-200"
                          )}
                        >
                          <option value="">সিরিজ নির্বাচন করুন</option>
                          <option value="__create_new__" className="font-semibold text-primary-600">+ নতুন সিরিজ তৈরি করুন</option>
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
                        <p className="text-sm text-primary-600 bengali-text flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          প্রথমে একটি নতুন সিরিজ তৈরি করুন
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 bengali-text flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary-600" />
                          নতুন সিরিজ তৈরি করুন
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingSeries(false);
                            setNewSeriesTitle('');
                            setNewSeriesDescription('');
                            setNewSeriesCategoryId('');
                            setSeriesCreationError('');
                          }}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {seriesCreationError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg bengali-text">
                          <AlertCircle className="h-4 w-4" />
                          {seriesCreationError}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium bengali-text">
                          সিরিজের শিরোনাম <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newSeriesTitle}
                          onChange={(e) => setNewSeriesTitle(e.target.value)}
                          placeholder="সিরিজের নাম লিখুন"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bengali-text"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium bengali-text">
                          সিরিজের বিবরণ
                        </label>
                        <textarea
                          value={newSeriesDescription}
                          onChange={(e) => setNewSeriesDescription(e.target.value)}
                          placeholder="এই সিরিজ সম্পর্কে কিছু লিখুন"
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bengali-text resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium bengali-text">
                          সিরিজের বিভাগ <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={newSeriesCategoryId}
                            onChange={(e) => setNewSeriesCategoryId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bengali-text appearance-none"
                          >
                            <option value="">বিভাগ নির্বাচন করুন</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!newSeriesTitle.trim()) {
                            setSeriesCreationError('সিরিজের শিরোনাম দিন');
                            return;
                          }
                          if (!newSeriesCategoryId) {
                            setSeriesCreationError('বিভাগ নির্বাচন করুন');
                            return;
                          }

                          try {
                            setSeriesCreationError('');
                            const response = await api.series.create({
                              title: newSeriesTitle,
                              description: newSeriesDescription,
                              category_id: newSeriesCategoryId,
                            });

                            if (response.success && response.data) {
                              // Add to series list
                              setUserSeries(prev => [...prev, response.data]);
                              // Select the new series
                              setFormData(prev => ({ ...prev, seriesId: response.data.id }));
                              // Close creation form
                              setIsCreatingSeries(false);
                              setNewSeriesTitle('');
                              setNewSeriesDescription('');
                              setNewSeriesCategoryId('');
                            }
                          } catch (error: any) {
                            setSeriesCreationError(error.message || 'সিরিজ তৈরিতে সমস্যা হয়েছে');
                          }
                        }}
                        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium bengali-text text-sm"
                      >
                        সিরিজ তৈরি করুন
                      </button>
                    </div>
                  )}


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
                        "w-full px-4 py-3 rounded-xl border bg-gray-50",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                        errors.chapterNumber ? "border-red-500" : "border-gray-200"
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
                <div className="relative">
                  <div
                    onClick={() => !formData.coverImagePreview && fileInputRef.current?.click()}
                    className={cn(
                      "relative border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden",
                      formData.coverImagePreview
                        ? "border-blue-500/50 bg-blue-50 cursor-default"
                        : "border-gray-300 hover:border-blue-400 hover:bg-gray-50 cursor-pointer",
                      errors.coverImage && "border-red-500"
                    )}
                  >
                    {formData.coverImagePreview ? (
                      <div className="relative group">
                        {/* Image Preview */}
                        <div className="relative aspect-video">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.coverImagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Control Buttons - Show on hover */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            type="button"
                            onClick={handleReCrop}
                            className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded shadow-md transition-all"
                            title="ছবি পুনরায় ক্রপ করুন"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded shadow-md transition-all"
                            title="ছবি পরিবর্তন করুন"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({
                                ...prev,
                                coverImage: null,
                                coverImagePreview: null,
                              }));
                              setOriginalImage(null);
                              setOriginalImageFile(null);
                            }}
                            className="bg-red-500/90 hover:bg-red-600 text-white p-2 rounded shadow-md transition-all"
                            title="ছবি মুছে ফেলুন"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-6">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium bengali-text">
                          ছবি আপলোড করুন
                        </span>
                        <span className="text-xs text-gray-400 mt-1 bengali-text">
                          JPEG, PNG, GIF, বা WebP (সর্বোচ্চ ৫MB)
                        </span>
                      </div>
                    )}
                  </div>
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
              <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium bengali-text">প্রিমিয়াম কন্টেন্ট</h4>
                    <p className="text-sm text-gray-500 bengali-text">শুধুমাত্র সাবস্ক্রাইবারদের জন্য</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isPremium: !prev.isPremium, price: !prev.isPremium ? prev.price : undefined }))}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      formData.isPremium ? "bg-primary-600" : "bg-gray-300"
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

                {/* Price Input (shown when isPremium is true) */}
                {formData.isPremium && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 bengali-text">
                      মূল্য (টাকা) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder="যেমন: ৫০"
                      className={cn(
                        "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
                        errors.price ? "border-red-500" : "border-gray-300"
                      )}
                    />
                    {errors.price && (
                      <p className="text-sm text-red-500 mt-1 bengali-text">{errors.price}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 bengali-text">
                      পাঠকদের এই কন্টেন্ট পড়তে দিতে হলে তাদের এই মূল্য পরিশোধ করতে হবে
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50:bg-gray-800 transition-colors bengali-text disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 bengali-text disabled:opacity-50"
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

      {/* Image Cropper Modal */}
      {showCropper && originalImage && originalImageFile && (
        <ImageCropper
          image={originalImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          originalFileName={originalImageFile.name}
        />
      )}
    </div>
  );
}


