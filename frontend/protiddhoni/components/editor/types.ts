/**
 * TipTap Editor Types
 */

export interface TiptapRef {
  setContent: (content: string) => void;
  getContent: () => string;
  clearContent: () => void;
  focus: () => void;
}

export interface TiptapProps {
  initialContent?: string;
  onContentChange?: (html: string) => void;
  onWordCountChange?: (count: number) => void;
  placeholder?: string;
}

export interface Draft {
  id: string;
  title: string;
  body: string;
  content_type?: string;
  series_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface ContentSubmission {
  title: string;
  body: string;
  excerpt?: string;
  content_type: 'story' | 'poem' | 'chapter' | 'link';
  category_id: string;
  series_id?: string;
  chapter_number?: number;
  cover_image_url?: string;
  external_url?: string;
  is_premium?: boolean;
  price?: number;
}

export interface PublishFormData {
  title: string;
  excerpt: string;
  contentType: 'story' | 'poem' | 'chapter' | 'link';
  categoryId: string;
  externalUrl?: string;
  seriesId?: string;
  chapterNumber?: number;
  isPremium: boolean;
  price?: number;
  coverImage: File | null;
  coverImagePreview: string | null;
}

export interface PublishFormErrors {
  title?: string;
  excerpt?: string;
  contentType?: string;
  category?: string;
  series?: string;
  chapterNumber?: string;
  externalUrl?: string;
  price?: string;
  coverImage?: string;
  general?: string;
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  total_chapters: number;
  is_completed: boolean;
}
