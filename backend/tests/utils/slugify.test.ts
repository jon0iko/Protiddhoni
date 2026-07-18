/**
 * Unit Tests for the slugify utility (utils/slugify.js).
 * Covers Bangla transliteration, URL-safe normalization, unique-suffix
 * generation, and suffix preservation when a title is edited.
 */

import slugify, { generateShortSuffix, updateSlugFromTitle } from '../../utils/slugify';

const SUFFIX = /^[0-9a-f]{8}$/;
const SLUG_WITH_SUFFIX = /^[a-z0-9-]+-[0-9a-f]{8}$/;

describe('slugify', () => {
    describe('base slug generation (no suffix)', () => {
        test('lowercases and hyphenates ASCII text', () => {
            expect(slugify('Hello World', false)).toBe('hello-world');
        });

        test('collapses repeated whitespace and trims', () => {
            expect(slugify('  Multiple   Spaces  ', false)).toBe('multiple-spaces');
        });

        test('strips special characters', () => {
            expect(slugify('Special!@#$%Chars', false)).toBe('specialchars');
        });

        test('collapses repeated hyphens into one', () => {
            expect(slugify('a---b', false)).toBe('a-b');
        });

        test('returns an empty string for falsy input', () => {
            expect(slugify('', false)).toBe('');
            expect(slugify(null, false)).toBe('');
            expect(slugify(undefined, false)).toBe('');
        });

        test('transliterates Bangla to an ASCII slug', () => {
            // ব + া + ং + ল + া  ->  b + a + ng + l + a
            expect(slugify('বাংলা', false)).toBe('bangla');
        });

        test('maps Bangla digits to Arabic digits', () => {
            expect(slugify('৫২০', false)).toBe('520');
        });

        test('always yields a URL-safe result for mixed input', () => {
            const out = slugify('গল্প: A Story! ২০২৪', false);
            expect(out).toMatch(/^[a-z0-9-]*$/);
            expect(out.startsWith('-')).toBe(false);
            expect(out.endsWith('-')).toBe(false);
        });
    });

    describe('unique-suffix generation', () => {
        test('appends an 8-char hex suffix by default', () => {
            expect(slugify('Hello World')).toMatch(/^hello-world-[0-9a-f]{8}$/);
        });

        test('produces a distinct suffix on each call', () => {
            const a = slugify('Same Title');
            const b = slugify('Same Title');
            expect(a).not.toBe(b);
            expect(a).toMatch(SLUG_WITH_SUFFIX);
            expect(b).toMatch(SLUG_WITH_SUFFIX);
        });

        test('generateShortSuffix returns 8 hex characters', () => {
            expect(generateShortSuffix()).toMatch(SUFFIX);
        });
    });

    describe('updateSlugFromTitle (preserves suffix on edit)', () => {
        test('keeps the existing 8-hex suffix when the title changes', () => {
            expect(updateSlugFromTitle('old-title-a1b2c3d4', 'New Title')).toBe('new-title-a1b2c3d4');
        });

        test('generates a fresh slug + suffix when no valid suffix is present', () => {
            const result = updateSlugFromTitle('no-valid-suffix-here', 'New Title');
            expect(result).toMatch(/^new-title-[0-9a-f]{8}$/);
        });

        test('falls back to a fresh slug when inputs are missing', () => {
            expect(updateSlugFromTitle('', 'New Story')).toMatch(/^new-story-[0-9a-f]{8}$/);
        });

        test('does not treat a non-hex final segment as a suffix', () => {
            // "zzzzzzzz" is 8 chars but not hex -> new slug generated
            const result = updateSlugFromTitle('title-zzzzzzzz', 'Fresh Title');
            expect(result).toMatch(/^fresh-title-[0-9a-f]{8}$/);
        });
    });
});
