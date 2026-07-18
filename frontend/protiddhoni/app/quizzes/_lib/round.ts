/**
 * Shared presentation helpers for scheduled quiz rounds.
 *
 * The server is the authority on a round's phase and on the entry window —
 * everything here is cosmetic. Client clock skew can make a countdown read a
 * second or two off; the RPCs enforce the real window.
 */

import { toBengaliNumber } from '@/lib/numberFormatter';
import type { RoundPhase } from '@/types';

export const PHASE_LABEL: Record<RoundPhase, string> = {
  draft: 'খসড়া',
  scheduled: 'শীঘ্রই শুরু',
  open: 'চলমান',
  closed: 'ফলাফলের অপেক্ষায়',
  settled: 'সম্পন্ন',
};

export const PHASE_STYLES: Record<RoundPhase, string> = {
  draft: 'bg-gray-100 text-gray-700 border border-gray-200',
  scheduled: 'bg-sky-50 text-sky-700 border border-sky-200',
  open: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  closed: 'bg-amber-50 text-amber-700 border border-amber-200',
  settled: 'bg-violet-50 text-violet-700 border border-violet-200',
};

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'সহজ',
  medium: 'মাঝারি',
  hard: 'কঠিন',
};

export const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  medium: 'bg-primary-50 text-primary-700 border border-primary-200',
  hard: 'bg-accent-50 text-accent-700 border border-accent-200',
};

export const EXAM_CATEGORY_OPTIONS = [
  'BCS',
  'Bank Job',
  'Primary',
  'NTRCA',
  'University Admission',
  'Other',
];

/** Milliseconds between now and an ISO timestamp; null when there is none. */
export function msUntil(iso: string | null | undefined, nowMs: number): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (!Number.isFinite(target)) return null;
  return target - nowMs;
}

/** "০২ ঘ ১৪ মি ০৯ সে" style countdown. */
export function formatCountdown(ms: number | null): string {
  if (ms == null) return '—';
  if (ms <= 0) return 'শেষ';

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${toBengaliNumber(days)} দিন ${toBengaliNumber(hours)} ঘ`;
  if (hours > 0) return `${toBengaliNumber(hours)} ঘ ${toBengaliNumber(minutes)} মি`;
  if (minutes > 0) return `${toBengaliNumber(minutes)} মি ${toBengaliNumber(seconds)} সে`;
  return `${toBengaliNumber(seconds)} সে`;
}

/** mm:ss clock for the in-game timer. */
export function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '—';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return toBengaliNumber(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
}

export function formatDuration(ms: number | null | undefined): string {
  if (!ms || !Number.isFinite(ms)) return '—';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${toBengaliNumber(seconds)} সেকেন্ড`;
  return `${toBengaliNumber(minutes)} মি ${toBengaliNumber(seconds)} সে`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return toBengaliNumber(
    date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  );
}

/** Convert an ISO timestamp to the value a <input type="datetime-local"> wants. */
export function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/** Inverse of toDatetimeLocal — local wall-clock string back to an ISO instant. */
export function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
