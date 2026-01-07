'use client';

import React, { useState } from 'react';
import { X, Save, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  defaultName?: string;
  isUpdate?: boolean;
}

export default function SaveDraftModal({
  isOpen,
  onClose,
  onSave,
  defaultName = '',
  isUpdate = false,
}: SaveDraftModalProps) {
  const [draftName, setDraftName] = useState(defaultName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDraftName(defaultName);
      setError(null);
    }
  }, [isOpen, defaultName]);

  const handleSave = async () => {
    if (!draftName.trim()) {
      setError('খসড়ার নাম দিন');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(draftName.trim());
      onClose();
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('খসড়া সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        "relative w-full max-w-md mx-4 p-6 rounded-2xl",
        "bg-white",
        "border border-gray-200",
        "shadow-2xl",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4 p-2 rounded-full",
            "text-gray-400 hover:text-gray-600:text-gray-300",
            "hover:bg-gray-100:bg-gray-800",
            "transition-colors"
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-blue-100">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 bengali-text">
              {isUpdate ? 'খসড়া আপডেট' : 'খসড়া সংরক্ষণ'}
            </h2>
            <p className="text-sm text-gray-500 bengali-text">
              {isUpdate ? 'আপনার সংরক্ষিত খসড়া আপডেট করুন' : 'পরে লেখা চালিয়ে যেতে একটি নাম দিন'}
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label 
            htmlFor="draft-name" 
            className="block text-sm font-medium text-gray-700 mb-2 bengali-text"
          >
            খসড়ার নাম
          </label>
          <input
            id="draft-name"
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="উদাহরণ: আমার প্রথম গল্প..."
            autoFocus
            className={cn(
              "w-full px-4 py-3 rounded-xl",
              "bg-gray-50",
              "border border-gray-200",
              "text-gray-900 bengali-text",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
              "transition-all"
            )}
          />
          {error && (
            <p className="mt-2 text-sm text-red-500 bengali-text">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl font-medium bengali-text",
              "border border-gray-300",
              "text-gray-700",
              "hover:bg-gray-50:bg-gray-800",
              "transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            বাতিল
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !draftName.trim()}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl font-medium bengali-text",
              "bg-primary-600 text-white",
              "hover:bg-blue-700",
              "transition-colors flex items-center justify-center gap-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                সংরক্ষণ হচ্ছে...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isUpdate ? 'আপডেট' : 'সংরক্ষণ'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

