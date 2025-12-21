/**
 * Image Upload Utilities for Supabase Storage
 */

import { supabase } from './supabase';

const BUCKET_NAME = 'images';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Generate a unique filename with timestamp and random string
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || 'jpg';
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Upload image to Supabase Storage bucket
 */
export async function uploadImage(file: File, folder: string = 'content'): Promise<UploadResult> {
  try {
    // Generate unique filename
    const filename = generateUniqueFilename(file.name);
    const filePath = `${folder}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: 'ছবি আপলোড করতে সমস্যা হয়েছে',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return {
      success: false,
      error: 'ছবি আপলোড করতে সমস্যা হয়েছে',
    };
  }
}

/**
 * Upload cover image for content
 */
export async function uploadCoverImage(file: File): Promise<UploadResult> {
  return uploadImage(file, 'covers');
}

/**
 * Upload image for editor content
 */
export async function uploadEditorImage(file: File): Promise<UploadResult> {
  return uploadImage(file, 'editor');
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(file: File): Promise<UploadResult> {
  return uploadImage(file, 'profiles');
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`);
    
    if (pathParts.length < 2) {
      console.error('Invalid image URL format');
      return false;
    }

    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

/**
 * Get public URL for an uploaded image
 */
export function getImageUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}
