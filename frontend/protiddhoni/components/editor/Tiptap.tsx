'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Typography } from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import { Mark } from '@tiptap/core';
import { useCallback, useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import MenuBar from './MenuBar';
import './tiptap.css';
import { validateImageFile, fileToBase64 } from '@/lib/utils';
import ImageWithCaption from './ImageWithCaption';
import type { TiptapRef, TiptapProps } from './types';

// Re-export types for consumers
export type { TiptapRef, TiptapProps } from './types';

const Tiptap = forwardRef<TiptapRef, TiptapProps>(({ 
  initialContent = '', 
  onContentChange, 
  onWordCountChange,
  placeholder = 'আপনার গল্প লিখতে শুরু করুন...',
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const lastContentRef = useRef<string>(initialContent);
  const isInitializedRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      // Use our custom image with caption extension
      ImageWithCaption,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-bold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
      TextStyle,
      Color,
      Typography,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      // Bengali Language Mark - applies Kalpurush font to Bengali text
      Mark.create({
        name: 'bengaliMark',
        parseHTML: () => [{ tag: 'span[data-bengali]' }],
        renderHTML: ({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) => [
          'span',
          { ...HTMLAttributes, 'data-bengali': 'true', class: 'font-kalpurush' },
          0,
        ],
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[500px] p-6 overflow-y-auto',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      // Only trigger callbacks if content actually changed
      if (html !== lastContentRef.current) {
        lastContentRef.current = html;
        if (onContentChange) onContentChange(html);
        if (onWordCountChange) onWordCountChange(words);
      }
    },
  }, []); // Empty deps - editor created once

  // Expose methods via ref for parent component to use
  useImperativeHandle(ref, () => ({
    setContent: (content: string) => {
      if (editor && !editor.isDestroyed) {
        lastContentRef.current = content;
        editor.commands.setContent(content, { emitUpdate: false });
      }
    },
    getContent: () => {
      return editor?.getHTML() || '';
    },
    clearContent: () => {
      if (editor && !editor.isDestroyed) {
        lastContentRef.current = '';
        editor.commands.clearContent();
      }
    },
    focus: () => {
      editor?.commands.focus();
    },
  }), [editor]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsUploading(true);

    try {
      // Show preview immediately using base64
      const base64Preview = await fileToBase64(file);
      
      // Insert image with our custom extension
      editor.chain().focus().insertContent({
        type: 'imageWithCaption',
        attrs: {
          src: base64Preview,
          alt: file.name,
          caption: '',
        },
      }).run();

      // TODO: In production, upload to your backend/storage service
      // For now, we're using base64 which works but isn't ideal for large images
      // You can implement backend upload here and replace the base64 with the uploaded URL
      
      console.log('Image inserted successfully');
    } catch (error) {
      console.error('Image insert failed:', error);
      alert('ছবি যোগ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [editor]);

  // Set initial content when editor is ready - only once
  useEffect(() => {
    if (editor && !editor.isDestroyed && !isInitializedRef.current) {
      if (initialContent) {
        editor.commands.setContent(initialContent, { emitUpdate: false });
        lastContentRef.current = initialContent;
      }
      isInitializedRef.current = true;
      
      // Calculate initial word count
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (onWordCountChange) onWordCountChange(words);
    }
  }, [editor, initialContent, onWordCountChange]);

  return (
    <div className="w-full mx-auto h-full flex flex-col shadow-xl">
      <div className="border rounded-lg bg-white dark:bg-gray-900 shadow-lg relative flex flex-col h-full overflow-visible border-gray-200 dark:border-gray-700">
        <MenuBar editor={editor} onImageUpload={handleImageUpload} />
        <div className="bg-white dark:bg-gray-900 overflow-y-auto flex-1 min-h-0 relative">
          <EditorContent editor={editor} />
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="bengali-text">ছবি আপলোড হচ্ছে...</span>
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
});

Tiptap.displayName = 'Tiptap';

export default Tiptap;
