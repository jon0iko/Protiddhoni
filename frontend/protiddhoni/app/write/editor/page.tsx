'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { 
  Tiptap, 
  EditorHeader, 
  SaveDraftModal, 
  DraftsListModal, 
  PublishModal 
} from '@/components/editor';
import type { TiptapRef, Draft } from '@/components/editor/types';
import { storage, countWordsInHtml } from '@/lib/utils';
import { api } from '@/lib/api';

// Storage key constants
const STORAGE_KEYS = {
  CONTENT: 'editor_content',
  WORD_COUNT: 'editor_word_count',
  DRAFT_ID: 'current_draft_id',
  DRAFT_NAME: 'current_draft_name',
} as const;

import { Suspense } from 'react';

function EditorContent() {
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tiptapRef = useRef<TiptapRef>(null);
  
  // Editor state
  const [wordCount, setWordCount] = useState(0);
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [isPageReady, setIsPageReady] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [showDraftsListModal, setShowDraftsListModal] = useState(false);
  
  // Draft tracking
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [currentDraftName, setCurrentDraftName] = useState<string>('');
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false);

  // Edit mode: the editor is loaded with an EXISTING content row (?edit=<id>)
  // instead of a draft. Saving goes through api.content.update rather than the
  // create-only publish flow.
  const [editContentId, setEditContentId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editWasPublished, setEditWasPublished] = useState(false);

  // Load an existing content item for editing
  const loadContentForEdit = useCallback(async (contentId: string) => {
    try {
      const response = await api.content.getById(contentId);
      const item = response?.data;

      if (!item) {
        alert('রচনাটি পাওয়া যায়নি।');
        return;
      }

      setEditContentId(item.id);
      setEditTitle(item.title || '');
      setEditExcerpt(item.excerpt || '');
      setEditWasPublished(!!item.is_published && item.status === 'approved');

      setContent(item.body || '');
      setInitialContent(item.body || '');
      setWordCount(countWordsInHtml(item.body || ''));

      // Editing an existing article must never touch the draft autosave slot.
      setCurrentDraftId(null);
      setCurrentDraftName(item.title || '');

      if (tiptapRef.current) {
        tiptapRef.current.setContent(item.body || '');
      }
    } catch (error) {
      console.error('Error loading content for edit:', error);
      alert('রচনাটি লোড করতে সমস্যা হয়েছে।');
    }
  }, []);

  // Save changes back to the published article
  const handleSaveEdit = useCallback(async () => {
    if (!editContentId) return;

    if (!editTitle.trim()) {
      alert('শিরোনাম লিখুন।');
      return;
    }
    if (!content || content === '<p></p>') {
      alert('সংরক্ষণ করার আগে কিছু লিখুন।');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.content.update(editContentId, {
        title: editTitle.trim(),
        body: content,
        excerpt: editExcerpt.trim()
      });

      if (response?.success) {
        setHasUnsavedChanges(false);
        alert(
          editWasPublished
            ? 'পরিবর্তন সংরক্ষিত হয়েছে। প্রকাশিত লেখার সম্পাদনা অ্যাডমিন পর্যালোচনার জন্য নথিভুক্ত হয়েছে।'
            : 'পরিবর্তন সংরক্ষিত হয়েছে।'
        );
        router.push('/my-stories');
      } else {
        alert(response?.error || 'পরিবর্তন সংরক্ষণ করতে সমস্যা হয়েছে।');
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      alert((error instanceof Error && error.message) || 'পরিবর্তন সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  }, [editContentId, editTitle, editExcerpt, editWasPublished, content, router]);

  // Load a specific draft by ID
  const loadDraftById = useCallback(async (draftId: string) => {
    try {
      const response = await api.drafts.getDraftById(draftId);
      const draft = response.data;
      
      if (draft) {
        setContent(draft.body || '');
        setInitialContent(draft.body || '');
        setCurrentDraftId(draft.id);
        setCurrentDraftName(draft.title || '');
        setWordCount(countWordsInHtml(draft.body || ''));
        
        // Update local storage
        storage.set(user?.id, STORAGE_KEYS.CONTENT, draft.body || '');
        storage.set(user?.id, STORAGE_KEYS.DRAFT_ID, draft.id);
        storage.set(user?.id, STORAGE_KEYS.DRAFT_NAME, draft.title || '');
        
        // Update editor content
        if (tiptapRef.current) {
          tiptapRef.current.setContent(draft.body || '');
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      alert('খসড়া লোড করতে সমস্যা হয়েছে।');
    }
  }, [user?.id]);
  
  // Load content from local storage on mount (user-specific)
  useEffect(() => {
    if (typeof window !== 'undefined' && !authLoading) {
      // Check if we should load a specific draft or an existing article from URL
      const editId = searchParams.get('edit');
      const draftId = searchParams.get('draft');
      if (editId) {
        // Editing an already-created content item
        loadContentForEdit(editId);
      } else if (draftId) {
        // Loading an existing draft from URL
        loadDraftById(draftId);
      } else {
        // Starting fresh - only restore content, not draft ID
        // This allows user to save as a NEW draft
        const savedContent = storage.get(user?.id, STORAGE_KEYS.CONTENT) || '';
        const savedWordCount = parseInt(storage.get(user?.id, STORAGE_KEYS.WORD_COUNT) || '0', 10);
        
        setInitialContent(savedContent);
        setContent(savedContent);
        setWordCount(savedWordCount);
        // Don't load draft ID - start fresh
        setCurrentDraftId(null);
        setCurrentDraftName('');
      }
      
      setIsPageReady(true);
    }
  }, [user?.id, authLoading, searchParams, loadDraftById, loadContentForEdit]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/write/editor');
    }
  }, [authLoading, isLoggedIn, router]);

  // Handle content changes
  const handleContentChange = useCallback((html: string) => {
    setContent(html);
    setHasUnsavedChanges(true);
    
    // Save to local storage immediately. Skipped in edit mode so revising a
    // published article never overwrites the user's in-progress new draft.
    if (typeof window !== 'undefined' && isPageReady && !editContentId) {
      storage.set(user?.id, STORAGE_KEYS.CONTENT, html);
    }
  }, [user?.id, isPageReady, editContentId]);

  // Handle word count changes
  const handleWordCountChange = useCallback((count: number) => {
    setWordCount(count);
    
    // Save word count to localStorage
    if (isPageReady && typeof window !== 'undefined') {
      storage.set(user?.id, STORAGE_KEYS.WORD_COUNT, count.toString());
    }
  }, [user?.id, isPageReady]);

  // Open save draft modal
  const handleSaveDraft = useCallback(() => {
    if (!content || content === '<p></p>') {
      alert('কিছু লিখুন সংরক্ষণ করার আগে।');
      return;
    }
    setShowSaveDraftModal(true);
  }, [content]);

  // Actually save the draft
  const handleSaveDraftConfirm = useCallback(async (name: string) => {
    if (!user?.id) {
      throw new Error('লগইন করুন');
    }

    setIsSaving(true);
    
    try {
      if (currentDraftId) {
        // Update existing draft
        const response = await api.drafts.updateDraft(currentDraftId, {
          title: name,
          body: content,
        });
        console.log('Draft updated:', response);
      } else {
        // Create new draft
        const response = await api.drafts.createDraft({
          title: name,
          body: content,
          content_type: 'story',
        });
        console.log('Draft created:', response);
        
        // Set the new draft ID after creation
        setCurrentDraftId(response.data.id);
        storage.set(user?.id, STORAGE_KEYS.DRAFT_ID, response.data.id);
      }
      
      setCurrentDraftName(name);
      storage.set(user?.id, STORAGE_KEYS.DRAFT_NAME, name);
      setHasUnsavedChanges(false);
      
      // Show success message
      alert('খসড়া সংরক্ষণ হয়েছে!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('খসড়া সংরক্ষণ করতে সমস্যা হয়েছে।');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, content, currentDraftId]);

  // Open drafts list modal
  const handleViewDrafts = useCallback(() => {
    setShowDraftsListModal(true);
  }, []);

  // Load a draft into the editor
  const handleLoadDraft = useCallback((draft: Draft) => {
    // Update state
    setContent(draft.body);
    setCurrentDraftId(draft.id);
    setCurrentDraftName(draft.title);
    setHasUnsavedChanges(false);
    
    // Calculate word count
    const count = countWordsInHtml(draft.body);
    setWordCount(count);
    
    // Save to local storage
    if (typeof window !== 'undefined' && user?.id) {
      storage.set(user?.id, STORAGE_KEYS.CONTENT, draft.body);
      storage.set(user?.id, STORAGE_KEYS.WORD_COUNT, count.toString());
      storage.set(user?.id, STORAGE_KEYS.DRAFT_ID, draft.id);
      storage.set(user?.id, STORAGE_KEYS.DRAFT_NAME, draft.title);
    }
    
    // Update the editor directly via ref
    if (tiptapRef.current) {
      tiptapRef.current.setContent(draft.body);
    }
  }, [user?.id]);

  // Open publish modal — or, in edit mode, save back to the existing article.
  const handlePublish = useCallback(() => {
    if (!content || content === '<p></p>') {
      alert('প্রকাশ করার আগে কিছু লিখুন।');
      return;
    }
    if (editContentId) {
      handleSaveEdit();
      return;
    }
    setShowPublishModal(true);
  }, [content, editContentId, handleSaveEdit]);

  // Handle publish success
  const handlePublishSuccess = useCallback(() => {
    // Clear local storage
    if (typeof window !== 'undefined' && user?.id) {
      storage.remove(user?.id, STORAGE_KEYS.CONTENT);
      storage.remove(user?.id, STORAGE_KEYS.WORD_COUNT);
      storage.remove(user?.id, STORAGE_KEYS.DRAFT_ID);
      storage.remove(user?.id, STORAGE_KEYS.DRAFT_NAME);
    }
    
    // Reset editor
    setContent('');
    setWordCount(0);
    setCurrentDraftId(null);
    setCurrentDraftName('');
    setHasUnsavedChanges(false);
    
    if (tiptapRef.current) {
      tiptapRef.current.clearContent();
    }
    
    // Navigate to write hub
    router.push('/write');
  }, [user?.id, router]);

  // Handle draft deletion from modal
  const handleDeleteDraft = useCallback((draftId: string) => {
    if (draftId === currentDraftId) {
      // Clear current draft if it's the one being deleted
      setCurrentDraftId(null);
      setCurrentDraftName('');
      storage.remove(user?.id, STORAGE_KEYS.DRAFT_ID);
      storage.remove(user?.id, STORAGE_KEYS.DRAFT_NAME);
    }
  }, [currentDraftId, user?.id]);

  // Show loading screen while checking auth
  if (authLoading || !isPageReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-500 bengali-text">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <EditorHeader
        wordCount={wordCount}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        currentDraftName={currentDraftName}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onViewDrafts={handleViewDrafts}
      />

      {/* Edit mode banner: title/excerpt fields + explicit save */}
      {editContentId && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-6">
          <div className="bg-white border border-purple-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <h2 className="text-sm font-semibold text-purple-700 mb-1 bengali-text">
                  প্রকাশিত লেখা সম্পাদনা
                </h2>
                {editWasPublished && (
                  <p className="text-xs text-gray-500 bengali-text">
                    এই লেখাটি ইতিমধ্যে প্রকাশিত। আপনার পরিবর্তন সঙ্গে সঙ্গে পাঠকের কাছে যাবে
                    এবং অ্যাডমিন পর্যালোচনার জন্য নথিভুক্ত হবে।
                  </p>
                )}
              </div>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 bengali-text"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                পরিবর্তন সংরক্ষণ করুন
              </button>
            </div>

            <div className="grid gap-3 mt-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 bengali-text">
                  শিরোনাম
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => {
                    setEditTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bengali-text"
                  placeholder="রচনার শিরোনাম"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 bengali-text">
                  সারসংক্ষেপ
                </label>
                <input
                  type="text"
                  value={editExcerpt}
                  onChange={(e) => {
                    setEditExcerpt(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bengali-text"
                  placeholder="সংক্ষিপ্ত বিবরণ"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="h-[calc(100vh-180px)]">
          <Tiptap
            ref={tiptapRef}
            initialContent={initialContent}
            onContentChange={handleContentChange}
            onWordCountChange={handleWordCountChange}
            placeholder="আপনার লেখা এখানে লিখুন..."
          />
        </div>
      </div>

      {/* Save Draft Modal */}
      <SaveDraftModal
        isOpen={showSaveDraftModal}
        onClose={() => setShowSaveDraftModal(false)}
        onSave={handleSaveDraftConfirm}
        defaultName={currentDraftName}
        isUpdate={!!currentDraftId}
      />

      {/* Drafts List Modal */}
      <DraftsListModal
        isOpen={showDraftsListModal}
        onClose={() => setShowDraftsListModal(false)}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={handleDeleteDraft}
      />

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        content={content}
        onPublishSuccess={handlePublishSuccess}
      />
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-500 bengali-text">লোড হচ্ছে...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
