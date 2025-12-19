'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, FileText, Trash2, Edit3, Loader2, Clock, FolderOpen } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { Draft } from './types';

interface DraftsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: (draft: Draft) => void;
  onDeleteDraft?: (draftId: string) => void;
}

export default function DraftsListModal({
  isOpen,
  onClose,
  onLoadDraft,
  onDeleteDraft,
}: DraftsListModalProps) {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch drafts when modal opens
  const fetchDrafts = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.content.getMyDrafts();
      // Map the response to Draft type
      const draftsData = response.data.map((item: { 
        id: string; 
        title: string; 
        body: string; 
        content_type?: string;
        series_id?: string;
        metadata?: Record<string, unknown>;
        created_at: string; 
        updated_at: string;
      }) => ({
        id: item.id,
        title: item.title || 'শিরোনামবিহীন',
        body: item.body || '',
        content_type: item.content_type,
        series_id: item.series_id,
        metadata: item.metadata,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      setDrafts(draftsData);
    } catch (err) {
      console.error('Error fetching drafts:', err);
      setError('খসড়া লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchDrafts();
    }
  }, [isOpen, user?.id, fetchDrafts]);

  // Handle draft deletion
  const handleDelete = async (draft: Draft, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`"${draft.title}" মুছে ফেলতে চান?`)) {
      return;
    }

    setDeletingId(draft.id);
    
    try {
      await api.content.delete(draft.id);
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
      onDeleteDraft?.(draft.id);
    } catch (err) {
      console.error('Error deleting draft:', err);
      alert('খসড়া মুছে ফেলতে সমস্যা হয়েছে');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle loading a draft
  const handleLoadDraft = (draft: Draft) => {
    onLoadDraft(draft);
    onClose();
  };

  // Get word count from content
  const getWordCount = (content: string) => {
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
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
        "relative w-full max-w-lg mx-4 rounded-2xl",
        "bg-white",
        "border border-gray-200",
        "shadow-2xl",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        "max-h-[80vh] flex flex-col"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100">
              <FolderOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 bengali-text">
                আপনার খসড়া
              </h2>
              <p className="text-sm text-gray-500 bengali-text">
                {drafts.length > 0 ? `${drafts.length}টি সংরক্ষিত খসড়া` : 'আপনার খসড়া এখানে দেখুন'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-full",
              "text-gray-400 hover:text-gray-600:text-gray-300",
              "hover:bg-gray-100:bg-gray-800",
              "transition-colors"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-gray-500 bengali-text">খসড়া লোড হচ্ছে...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-500 mb-4 bengali-text">{error}</p>
              <button 
                onClick={fetchDrafts}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50:bg-gray-800 transition-colors bengali-text"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 bengali-text">
                কোন খসড়া নেই
              </h3>
              <p className="text-gray-500 max-w-xs bengali-text">
                লেখা শুরু করুন এবং পরে চালিয়ে যেতে খসড়া হিসেবে সংরক্ষণ করুন।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  onClick={() => handleLoadDraft(draft)}
                  className={cn(
                    "group p-4 rounded-xl cursor-pointer",
                    "bg-gray-50",
                    "border border-gray-100",
                    "hover:border-blue-300 hover:bg-blue-50:bg-blue-900/20",
                    "transition-all duration-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Edit3 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <h3 className="font-medium text-gray-900 truncate bengali-text">
                          {draft.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="bengali-text">{formatRelativeTime(draft.updated_at)}</span>
                        </span>
                        <span className="bengali-text">{getWordCount(draft.body)} শব্দ</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(draft, e)}
                      disabled={deletingId === draft.id}
                      className={cn(
                        "p-2 rounded-lg opacity-0 group-hover:opacity-100",
                        "text-gray-400 hover:text-red-500",
                        "hover:bg-red-50:bg-red-900/20",
                        "transition-all",
                        "disabled:opacity-50"
                      )}
                    >
                      {deletingId === draft.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

