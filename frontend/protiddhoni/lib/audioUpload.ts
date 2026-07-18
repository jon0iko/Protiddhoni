/**
 * Audio Upload Utilities for Supabase Storage
 *
 * Mirrors lib/imageUpload.ts. Uploads narration MP3/WAV files to the same public
 * `images` bucket (under an `audio/` folder) and returns a public URL to store
 * in content.audio_url.
 *
 * NOTE: For a demo you can also just drag-drop the files into the bucket via the
 * Supabase Dashboard (Storage → images → new folder `audio`). This helper is here
 * if you'd rather upload from code or add an admin upload UI later.
 */

import { supabase } from './supabase';

const BUCKET_NAME = 'images';

export interface AudioUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

function generateAudioFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || 'mp3';
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Upload a narration audio file (MP3/WAV) to Supabase Storage.
 * Returns the public URL to store in content.audio_url.
 */
export async function uploadAudio(file: File): Promise<AudioUploadResult> {
  try {
    const filename = generateAudioFilename(file.name);
    const filePath = `audio/${filename}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '31536000', // 1 year — narration audio never changes
        upsert: false,
        contentType: file.type || 'audio/mpeg',
      });

    if (error) {
      console.error('Audio upload error:', error);
      return { success: false, error: 'অডিও আপলোড করতে সমস্যা হয়েছে' };
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Audio upload exception:', error);
    return { success: false, error: 'অডিও আপলোড করতে সমস্যা হয়েছে' };
  }
}
