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

export default function EditorPage() {
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

  // Load a specific draft by ID
  const loadDraftById = useCallback(async (draftId: string) => {
    try {
      const response = await api.content.getById(draftId);
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
    }
  }, [user?.id]);
  
  // Load content from local storage on mount (user-specific)
  useEffect(() => {
    if (typeof window !== 'undefined' && !authLoading) {
      const savedContent = storage.get(user?.id, STORAGE_KEYS.CONTENT) || '';
      const savedWordCount = parseInt(storage.get(user?.id, STORAGE_KEYS.WORD_COUNT) || '0', 10);
      const savedDraftId = storage.get(user?.id, STORAGE_KEYS.DRAFT_ID) || null;
      const savedDraftName = storage.get(user?.id, STORAGE_KEYS.DRAFT_NAME) || '';
      
      // Check if we should load a specific draft from URL
      const draftId = searchParams.get('draft');
      if (draftId) {
        loadDraftById(draftId);
      } else {
        setInitialContent(savedContent);
        setContent(savedContent);
        setWordCount(savedWordCount);
        setCurrentDraftId(savedDraftId);
        setCurrentDraftName(savedDraftName);
      }
      
      setIsPageReady(true);
    }
  }, [user?.id, authLoading, searchParams, loadDraftById]);

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
    
    // Save to local storage immediately
    if (typeof window !== 'undefined' && isPageReady) {
      storage.set(user?.id, STORAGE_KEYS.CONTENT, html);
    }
  }, [user?.id, isPageReady]);

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
        await api.content.update(currentDraftId, {
          title: name,
          body: content,
        });
      } else {
        // Create new draft
        const response = await api.content.create({
          title: name,
          body: content,
          content_type: 'story',
          status: 'draft',
        });
        
        setCurrentDraftId(response.data.id);
        storage.set(user?.id, STORAGE_KEYS.DRAFT_ID, response.data.id);
      }
      
      setCurrentDraftName(name);
      storage.set(user?.id, STORAGE_KEYS.DRAFT_NAME, name);
      setHasUnsavedChanges(false);
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

  // Open publish modal
  const handlePublish = useCallback(() => {
    if (!content || content === '<p></p>') {
      alert('প্রকাশ করার আগে কিছু লিখুন।');
      return;
    }
    setShowPublishModal(true);
  }, [content]);

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
