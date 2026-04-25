'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Loader2 } from 'lucide-react';
import type { Area } from 'react-easy-crop';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImageFile: File) => void;
  onCancel: () => void;
  originalFileName: string;
}

export default function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  originalFileName,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async (): Promise<File | null> => {
    if (!croppedAreaPixels) return null;

    try {
      const imageElement = new Image();
      imageElement.src = image;

      await new Promise((resolve, reject) => {
        imageElement.onload = resolve;
        imageElement.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('ক্যানভাস কনটেক্সট তৈরি করতে ব্যর্থ');
      }

      // Set canvas size to cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw the cropped image
      ctx.drawImage(
        imageElement,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('ছবি প্রসেস করতে ব্যর্থ'));
              return;
            }

            // Create File from Blob
            const file = new File([blob], originalFileName, {
              type: blob.type,
              lastModified: Date.now(),
            });

            resolve(file);
          },
          'image/jpeg',
          0.95 // Quality
        );
      });
    } catch (err) {
      console.error('Crop error:', err);
      throw err;
    }
  };

  const handleApplyCrop = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const croppedFile = await createCroppedImage();

      if (!croppedFile) {
        throw new Error('ছবি ক্রপ করতে ব্যর্থ');
      }

      // Validate dimensions
      const img = new Image();
      const objectUrl = URL.createObjectURL(croppedFile);
      img.src = objectUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      URL.revokeObjectURL(objectUrl);

      // Check minimum dimensions
      if (img.width < 400 || img.height < 300) {
        setError(
          `সতর্কতা: ছবির আকার খুব ছোট (${img.width}x${img.height}px)। সর্বনিম্ন ৪০০x৩০০px সুপারিশ করা হয়।`
        );
        // Allow to proceed with warning
      }

      // Check file size (5MB limit)
      if (croppedFile.size > 5 * 1024 * 1024) {
        setError('ছবির আকার ৫MB এর বেশি। দয়া করে ছোট এলাকা নির্বাচন করুন।');
        setIsProcessing(false);
        return;
      }

      onCropComplete(croppedFile);
    } catch (err) {
      console.error('Apply crop error:', err);
      setError(err instanceof Error ? err.message : 'ছবি ক্রপ করতে সমস্যা হয়েছে');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Cropper Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white bengali-text">ছবি ক্রপ করুন</h3>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative h-[60vh] bg-black">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
            objectFit="contain"
          />
        </div>

        {/* Controls */}
        <div className="relative z-10 px-6 py-4 bg-gray-800/95 backdrop-blur-sm space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-sm bengali-text">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 font-medium hover:bg-gray-700 transition-colors bengali-text disabled:opacity-50"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 bengali-text disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  প্রসেস হচ্ছে...
                </>
              ) : (
                'ক্রপ করুন'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
