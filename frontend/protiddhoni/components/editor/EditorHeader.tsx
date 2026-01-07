'use client';

import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  FolderOpen,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import { cn, formatWordCount } from '@/lib/utils';
import { useState } from 'react';

interface EditorHeaderProps {
  wordCount: number;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  currentDraftName?: string;
  onSaveDraft: () => void;
  onPublish: () => void;
  onViewDrafts: () => void;
  onPreview?: () => void;
}

export default function EditorHeader({
  wordCount,
  isSaving = false,
  hasUnsavedChanges = false,
  currentDraftName,
  onSaveDraft,
  onPublish,
  onViewDrafts,
  onPreview,
}: EditorHeaderProps) {
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('সংরক্ষণ না করে ফিরে যেতে চান?')) {
        router.push('/write');
      }
    } else {
      router.push('/write');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100:bg-gray-800 transition-colors"
              title="ফিরে যান"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="hidden sm:block">
              <h1 className="font-semibold text-gray-900 bengali-text">
                {currentDraftName || 'নতুন লেখা'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="bengali-text">{formatWordCount(wordCount)}</span>
                {hasUnsavedChanges && (
                  <span className="text-amber-500 bengali-text">• অসংরক্ষিত</span>
                )}
                {isSaving && (
                  <span className="text-blue-500 bengali-text">• সংরক্ষণ হচ্ছে...</span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile word count */}
          <div className="sm:hidden text-sm text-gray-500 bengali-text">
            {formatWordCount(wordCount)}
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onViewDrafts}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                "text-gray-600",
                "hover:bg-gray-100:bg-gray-800",
                "transition-colors bengali-text"
              )}
            >
              <FolderOpen className="h-4 w-4" />
              খসড়া
            </button>

            {onPreview && (
              <button
                onClick={onPreview}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg",
                  "text-gray-600",
                  "hover:bg-gray-100:bg-gray-800",
                  "transition-colors bengali-text"
                )}
              >
                <Eye className="h-4 w-4" />
                প্রিভিউ
              </button>
            )}

            <button
              onClick={onSaveDraft}
              disabled={isSaving}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "border border-gray-300",
                "text-gray-700",
                "hover:bg-gray-50:bg-gray-800",
                "transition-colors bengali-text",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Save className="h-4 w-4" />
              সংরক্ষণ
            </button>

            <button
              onClick={onPublish}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary-600 text-white",
                "hover:bg-blue-700",
                "transition-colors bengali-text"
              )}
            >
              <Send className="h-4 w-4" />
              প্রকাশ
            </button>
          </div>

          {/* Right Section - Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onSaveDraft}
              disabled={isSaving}
              className="p-2 rounded-lg hover:bg-gray-100:bg-gray-800 transition-colors disabled:opacity-50"
              title="সংরক্ষণ"
            >
              <Save className="h-5 w-5" />
            </button>

            <button
              onClick={onPublish}
              className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              title="প্রকাশ"
            >
              <Send className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg hover:bg-gray-100:bg-gray-800 transition-colors"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>

              {showMobileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMobileMenu(false)} 
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <button
                      onClick={() => {
                        onViewDrafts();
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50:bg-gray-700 flex items-center gap-2 bengali-text"
                    >
                      <FolderOpen className="h-4 w-4" />
                      খসড়া দেখুন
                    </button>
                    {onPreview && (
                      <button
                        onClick={() => {
                          onPreview();
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50:bg-gray-700 flex items-center gap-2 bengali-text"
                      >
                        <Eye className="h-4 w-4" />
                        প্রিভিউ
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

