/**
 * FontSizeStrategy -- reader font sizing.
 *
 * Structural twin of ThemeStrategy, which sits at 100% coverage, while this file
 * was at 0/28 statements and 0/9 branches. Both are pure TypeScript despite the
 * .tsx extension: no JSX, no React, no network.
 *
 * The behaviour worth protecting is that each strategy writes the correct CSS
 * custom property. Getting the mapping wrong does not throw -- it silently
 * renders every reader at the wrong size, which is the sort of defect that ships.
 *
 * Note: deliberately no "the pattern demonstrates Open/Closed" style assertions
 * like `expect(typeof x).toBe('function')`. Those add test count without adding
 * any ability to detect a regression.
 */

import {
    SmallFont,
    MediumFont,
    LargeFont,
    XLargeFont,
    FontSizeContext,
    createFontSizeStrategy,
    type FontSizeType
} from '@/components/reader/FontSizeStrategy';

const PROPERTY = '--current-reader-font-size';

let setProperty: jest.SpyInstance;

beforeEach(() => {
    setProperty = jest.spyOn(document.documentElement.style, 'setProperty').mockImplementation(() => {});
});

afterEach(() => {
    setProperty.mockRestore();
});

describe('individual strategies', () => {
    const cases: Array<[string, any, FontSizeType, string]> = [
        ['SmallFont', SmallFont, 'small', 'var(--reader-font-small)'],
        ['MediumFont', MediumFont, 'medium', 'var(--reader-font-medium)'],
        ['LargeFont', LargeFont, 'large', 'var(--reader-font-large)'],
        ['XLargeFont', XLargeFont, 'xlarge', 'var(--reader-font-xlarge)']
    ];

    it.each(cases)('%s writes its own CSS variable', (_name, Strategy, _size, expectedValue) => {
        new Strategy().applyFontSize();

        expect(setProperty).toHaveBeenCalledWith(PROPERTY, expectedValue);
    });

    it.each(cases)('%s reports its size', (_name, Strategy, expectedSize) => {
        expect(new Strategy().getFontSize()).toBe(expectedSize);
    });

    it('each strategy maps to a distinct CSS value', () => {
        const values = cases.map(([, Strategy]) => {
            setProperty.mockClear();
            new Strategy().applyFontSize();
            return setProperty.mock.calls[0][1];
        });

        // A copy-paste slip between the four classes would collapse two of these.
        expect(new Set(values).size).toBe(4);
    });
});

describe('FontSizeContext', () => {
    it('delegates applyFontSize to the current strategy', () => {
        const context = new FontSizeContext(new LargeFont());

        context.applyFontSize();

        expect(setProperty).toHaveBeenCalledWith(PROPERTY, 'var(--reader-font-large)');
    });

    it('reports the current strategy size', () => {
        expect(new FontSizeContext(new SmallFont()).getFontSize()).toBe('small');
    });

    it('applies immediately on setStrategy, without a second call', () => {
        const context = new FontSizeContext(new SmallFont());
        setProperty.mockClear();

        context.setStrategy(new XLargeFont());

        // The reader must resize the moment the control is changed.
        expect(setProperty).toHaveBeenCalledTimes(1);
        expect(setProperty).toHaveBeenCalledWith(PROPERTY, 'var(--reader-font-xlarge)');
        expect(context.getFontSize()).toBe('xlarge');
    });

    it('supports switching back and forth at runtime', () => {
        const context = new FontSizeContext(new MediumFont());

        context.setStrategy(new LargeFont());
        expect(context.getFontSize()).toBe('large');

        context.setStrategy(new MediumFont());
        expect(context.getFontSize()).toBe('medium');
        expect(setProperty).toHaveBeenLastCalledWith(PROPERTY, 'var(--reader-font-medium)');
    });
});

describe('createFontSizeStrategy factory', () => {
    it.each([
        ['small', SmallFont],
        ['medium', MediumFont],
        ['large', LargeFont],
        ['xlarge', XLargeFont]
    ])('builds the %s strategy', (size, Expected) => {
        expect(createFontSizeStrategy(size as FontSizeType)).toBeInstanceOf(Expected);
    });

    it('falls back to medium for an unrecognised value', () => {
        // Stored preferences come from the database and can predate a rename, so
        // the default arm is a real path, not defensive decoration.
        expect(createFontSizeStrategy('gigantic' as FontSizeType)).toBeInstanceOf(MediumFont);
        expect(createFontSizeStrategy(undefined as unknown as FontSizeType)).toBeInstanceOf(MediumFont);
    });

    it('produces a strategy that is immediately usable', () => {
        createFontSizeStrategy('large').applyFontSize();

        expect(setProperty).toHaveBeenCalledWith(PROPERTY, 'var(--reader-font-large)');
    });
});
