/**
 * Unit Tests for lib/utils.ts — the frontend's core formatting/validation rules:
 * slug generation, UTC date parsing, Bengali number/relative-time formatting,
 * HTML excerpt/word-count helpers, image validation, storage keys, and debounce.
 */

import {
    slugify,
    parseUTCDate,
    formatRelativeTime,
    toBengaliNumber,
    formatWordCount,
    getExcerptFromHtml,
    countWordsInHtml,
    validateImageFile,
    storage,
    debounce,
} from '@/lib/utils';

describe('slugify', () => {
    test('lowercases and hyphenates ASCII text deterministically', () => {
        expect(slugify('Hello World')).toBe('hello-world');
    });

    test('strips punctuation from ASCII text', () => {
        expect(slugify('Hello, World!')).toBe('hello-world');
    });

    test('preserves Bengali characters and appends a unique suffix', () => {
        const result = slugify('বাংলা গল্প');
        expect(result.startsWith('বাংলা-গল্প-')).toBe(true);
        // suffix is a base36 timestamp
        expect(result).toMatch(/-[0-9a-z]+$/);
    });
});

describe('parseUTCDate', () => {
    test('treats a timezone-less timestamp as UTC (appends Z)', () => {
        expect(parseUTCDate('2024-01-01T00:00:00').toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });

    test('respects an explicit Z suffix', () => {
        expect(parseUTCDate('2024-01-01T12:30:00Z').toISOString()).toBe('2024-01-01T12:30:00.000Z');
    });

    test('respects an explicit timezone offset', () => {
        expect(parseUTCDate('2024-01-01T00:00:00+06:00').toISOString()).toBe('2023-12-31T18:00:00.000Z');
    });

    test('returns a Date for empty input', () => {
        expect(parseUTCDate('')).toBeInstanceOf(Date);
    });
});

describe('toBengaliNumber / formatWordCount', () => {
    test('converts ASCII digits to Bengali numerals', () => {
        expect(toBengaliNumber(123)).toBe('১২৩');
        expect(toBengaliNumber(0)).toBe('০');
    });

    test('formats a word count with the Bengali unit', () => {
        expect(formatWordCount(5)).toBe('৫ শব্দ');
    });
});

describe('formatRelativeTime', () => {
    test('reports very recent times as এইমাত্র', () => {
        expect(formatRelativeTime(new Date().toISOString())).toBe('এইমাত্র');
    });

    test('reports an hours-old timestamp in ঘন্টা', () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        expect(formatRelativeTime(twoHoursAgo)).toMatch(/ঘন্টা আগে/);
    });

    test('reports a ~25h-old timestamp as গতকাল', () => {
        const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
        expect(formatRelativeTime(yesterday)).toBe('গতকাল');
    });
});

describe('getExcerptFromHtml', () => {
    test('strips tags and collapses whitespace', () => {
        expect(getExcerptFromHtml('<p>Hello   <b>world</b></p>')).toBe('Hello world');
    });

    test('truncates long content and appends an ellipsis', () => {
        expect(getExcerptFromHtml('<p>abcdefghij</p>', 5)).toBe('abcde...');
    });
});

describe('countWordsInHtml', () => {
    test('counts words after stripping tags', () => {
        expect(countWordsInHtml('<p>hello world foo</p>')).toBe(3);
    });

    test('returns 0 for empty/tag-only content', () => {
        expect(countWordsInHtml('<p></p>')).toBe(0);
        expect(countWordsInHtml('')).toBe(0);
    });
});

describe('validateImageFile', () => {
    test('accepts a supported image type under the size limit', () => {
        const file = new File(['tiny'], 'photo.png', { type: 'image/png' });
        expect(validateImageFile(file)).toEqual({ valid: true });
    });

    test('rejects an unsupported file type', () => {
        const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
        const result = validateImageFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/সমর্থিত নয়/);
    });

    test('rejects a file larger than 5MB', () => {
        const bigContent = 'x'.repeat(5 * 1024 * 1024 + 1);
        const file = new File([bigContent], 'big.png', { type: 'image/png' });
        const result = validateImageFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/MB/);
    });
});

describe('storage', () => {
    beforeEach(() => localStorage.clear());

    test('namespaces keys per user vs guest', () => {
        expect(storage.getKey('u1', 'theme')).toBe('protiddhoni_user_u1_theme');
        expect(storage.getKey(undefined, 'theme')).toBe('protiddhoni_guest_theme');
    });

    test('round-trips a value and removes it', () => {
        storage.set('u1', 'theme', 'dark');
        expect(storage.get('u1', 'theme')).toBe('dark');
        storage.remove('u1', 'theme');
        expect(storage.get('u1', 'theme')).toBeNull();
    });
});

describe('debounce', () => {
    test('invokes the function once after the wait window', () => {
        jest.useFakeTimers();
        const fn = jest.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced();
        debounced();
        expect(fn).not.toHaveBeenCalled();

        jest.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
    });
});
