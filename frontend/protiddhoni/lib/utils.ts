/**
 * Utility functions for Protiddhoni
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and merges Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Slugify a string for URLs
 */
export function slugify(text: string): string {
  // Handle Bengali text by creating a URL-safe slug
  const bengaliPattern = /[\u0980-\u09FF]/;
  
  if (bengaliPattern.test(text)) {
    // For Bengali text, create a URL-safe slug using base encoding
    const base = text
      .toLowerCase()
      .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Add a timestamp-based suffix for uniqueness
    return `${base}-${Date.now().toString(36)}`;
  }
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Parse a date string as UTC.
 * Supabase returns timestamps in UTC but sometimes without the 'Z' suffix,
 * causing browsers to treat them as local time (off by timezone offset).
 */
export function parseUTCDate(dateString: string): Date {
  if (!dateString) return new Date();
  // If the string already has timezone info (Z, +, or - offset), parse as-is
  if (/Z|[+-]\d{2}:\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }
  // Otherwise append 'Z' to treat it as UTC
  return new Date(dateString + 'Z');
}

/**
 * Format relative time in Bengali with second-level precision
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseUTCDate(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffSecs < 5) return 'এইমাত্র';
  if (diffSecs < 60) return `${diffSecs} সেকেন্ড আগে`;
  if (diffMins < 60) return `${diffMins} মিনিট আগে`;
  if (diffHours < 24) return `${diffHours} ঘন্টা আগে`;
  if (diffDays === 1) return 'গতকাল';
  if (diffDays < 7) return `${diffDays} দিন আগে`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} সপ্তাহ আগে`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} মাস আগে`;
  
  return date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Convert number to Bengali numerals
 */
export function toBengaliNumber(num: number): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('');
}

/**
 * Format word count with Bengali text
 */
export function formatWordCount(count: number): string {
  return `${toBengaliNumber(count)} শব্দ`;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    const fileExt = file.name.split('.').pop()?.toUpperCase() || 'অজানা';
    return { 
      valid: false, 
      error: `${fileExt} ফরম্যাট সমর্থিত নয়। শুধুমাত্র JPEG, PNG, GIF, বা WebP ফাইল আপলোড করুন।` 
    };
  }
  
  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return { 
      valid: false, 
      error: `ফাইলের আকার ${fileSizeMB}MB। সর্বোচ্চ ৫MB আকারের ফাইল আপলোড করুন।` 
    };
  }
  
  return { valid: true };
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Get excerpt from HTML content
 */
export function getExcerptFromHtml(html: string, maxLength: number = 200): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Count words in HTML content
 */
export function countWordsInHtml(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Local storage helpers with user-specific keys
 */
export const storage = {
  getKey: (userId: string | undefined, key: string): string => {
    return userId ? `protiddhoni_user_${userId}_${key}` : `protiddhoni_guest_${key}`;
  },
  
  get: (userId: string | undefined, key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(storage.getKey(userId, key));
  },
  
  set: (userId: string | undefined, key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(storage.getKey(userId, key), value);
  },
  
  remove: (userId: string | undefined, key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(storage.getKey(userId, key));
  },
};
