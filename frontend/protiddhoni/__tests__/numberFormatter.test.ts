/**
 * Unit Tests for lib/numberFormatter.ts — Bengali numeral conversion and the
 * optional Number.prototype.toLocaleString override.
 */

import { toBengaliNumber, initializeBengaliNumbers } from '@/lib/numberFormatter';

describe('toBengaliNumber', () => {
    test('converts a numeric string to Bengali numerals', () => {
        expect(toBengaliNumber('2024')).toBe('২০২৪');
    });

    test('converts a number to Bengali numerals', () => {
        expect(toBengaliNumber(90)).toBe('৯০');
    });

    test('leaves non-digit characters untouched', () => {
        expect(toBengaliNumber('৳1,250')).toBe('৳১,২৫০');
    });
});

describe('initializeBengaliNumbers', () => {
    const originalToLocaleString = Number.prototype.toLocaleString;

    afterEach(() => {
        // Restore the prototype so this global patch cannot leak.
        Number.prototype.toLocaleString = originalToLocaleString;
    });

    test('makes the Bengali locale render Bengali digits', () => {
        initializeBengaliNumbers();
        const result = (1234).toLocaleString('bn-BD');
        expect(/[০-৯]/.test(result)).toBe(true); // has Bengali digits
        expect(/[0-9]/.test(result)).toBe(false); // no ASCII digits remain
    });

    test('leaves an explicit non-Bengali locale as ASCII', () => {
        initializeBengaliNumbers();
        expect((1234).toLocaleString('en-US')).toBe('1,234');
    });
});
