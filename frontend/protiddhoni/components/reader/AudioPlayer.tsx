'use client';

/**
 * AudioPlayer — Bangla audiobook narration player.
 *
 * Given a public MP3 URL (content.audio_url), renders a themed, preloading
 * player. `preload="auto"` means the browser buffers the file while the user
 * is reading, so pressing play is effectively instant. Works with audio hosted
 * on Supabase Storage (CDN, range-request friendly) or the local /public folder.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Loader2,
  RotateCcw,
  RotateCw,
  Headphones,
  AlertCircle,
} from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
}

// Playback speeds, cycled by the speed button (audiobook-friendly).
const SPEEDS = [1, 1.25, 1.5, 2, 0.75];

const toBengaliDigits = (value: string | number): string =>
  value.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return toBengaliDigits('0:00');
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${toBengaliDigits(mins)}:${toBengaliDigits(secs.toString().padStart(2, '0'))}`;
};

export default function AudioPlayer({ src, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);

  // Reset state whenever the source changes (e.g. navigating between stories).
  useEffect(() => {
    setIsPlaying(false);
    setIsReady(false);
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    setSpeedIndex(0);
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setHasError(true));
    }
  };

  const skip = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const max = duration || audio.duration || 0;
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + delta), max);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="rounded-xl border p-4 mb-8 shadow-sm"
      style={{
        backgroundColor: 'var(--reader-card-bg)',
        borderColor: 'var(--reader-border)',
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setIsReady(true);
        }}
        onCanPlay={() => setIsReady(true)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => setHasError(true)}
      />

      <div className="flex items-center gap-2 mb-3 min-w-0">
        <Headphones className="w-5 h-5 shrink-0" style={{ color: 'var(--reader-secondary-text)' }} />
        <span
          className="text-sm font-semibold bengali-text truncate"
          style={{ color: 'var(--reader-text)' }}
        >
          এই গল্পটি শুনুন{title ? ` — ${title}` : ''}
        </span>
      </div>

      {hasError ? (
        <div className="flex items-center gap-2 text-sm bengali-text" style={{ color: '#b91c1c' }}>
          <AlertCircle className="w-4 h-4" />
          <span>অডিও লোড করা যায়নি। পরে আবার চেষ্টা করুন।</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => skip(-10)}
            disabled={!isReady}
            className="p-2 rounded-full transition-colors disabled:opacity-40 hover:bg-black/5"
            style={{ color: 'var(--reader-secondary-text)' }}
            title="১০ সেকেন্ড পিছনে"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            disabled={!isReady}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {!isReady ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => skip(10)}
            disabled={!isReady}
            className="p-2 rounded-full transition-colors disabled:opacity-40 hover:bg-black/5"
            style={{ color: 'var(--reader-secondary-text)' }}
            title="১০ সেকেন্ড সামনে"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-3 min-w-0">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              step="any"
              onChange={handleSeek}
              disabled={!isReady}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, #2563eb ${progress}%, var(--reader-border) ${progress}%)`,
              }}
              aria-label="Seek"
            />
            <span
              className="text-xs tabular-nums whitespace-nowrap"
              style={{ color: 'var(--reader-secondary-text)' }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button
            onClick={cycleSpeed}
            disabled={!isReady}
            className="text-xs font-semibold px-2 py-1 rounded-md border transition-colors disabled:opacity-40 shrink-0"
            style={{
              color: 'var(--reader-secondary-text)',
              borderColor: 'var(--reader-border)',
            }}
            title="গতি পরিবর্তন করুন"
          >
            {toBengaliDigits(SPEEDS[speedIndex])}x
          </button>
        </div>
      )}
    </div>
  );
}
