/**
 * geminiService._sanitizeQuestions -- the boundary between model output and the
 * database.
 *
 * Everything Gemini returns passes through here before an administrator ever
 * sees it, so this function is the only thing stopping a malformed or truncated
 * generation from becoming a quiz question with no correct answer. It is pure:
 * no network, no clock, no environment. It also held roughly half of the file's
 * uncovered branches.
 */

import geminiService from '../../services/geminiService';

const sanitize = (input: any) => (geminiService as any)._sanitizeQuestions(input);

const valid = (over: Record<string, any> = {}) => ({
    question: 'Who narrates the story?',
    options: ['Rumi', 'Nishith', 'Ayesha', 'Kamal'],
    correctIndex: 1,
    explanation: 'Stated in the opening paragraph.',
    ...over
});

describe('input guards', () => {
    it.each([
        ['undefined', undefined],
        ['null', null],
        ['a string', 'not an array'],
        ['an object', { questions: [] }],
        ['a number', 42]
    ])('returns [] for %s', (_label, input) => {
        expect(sanitize(input)).toEqual([]);
    });

    it('returns [] for an empty array', () => {
        expect(sanitize([])).toEqual([]);
    });
});

describe('question text', () => {
    it('accepts a well-formed question and trims it', () => {
        const [result] = sanitize([valid({ question: '  Who narrates?  ' })]);
        expect(result.question).toBe('Who narrates?');
    });

    it.each([
        ['a null entry', null],
        ['undefined entry', undefined],
        ['a missing question', { options: ['a', 'b', 'c', 'd'], correctIndex: 0 }],
        ['a non-string question', { question: 42, options: ['a', 'b', 'c', 'd'], correctIndex: 0 }]
    ])('drops %s', (_label, entry) => {
        expect(sanitize([entry])).toEqual([]);
    });
});

describe('options -- the exactly-four rule', () => {
    it('rejects fewer than four options', () => {
        expect(sanitize([valid({ options: ['a', 'b', 'c'] })])).toEqual([]);
    });

    it('rejects more than four options', () => {
        expect(sanitize([valid({ options: ['a', 'b', 'c', 'd', 'e'] })])).toEqual([]);
    });

    it('rejects a missing or non-array options field', () => {
        expect(sanitize([valid({ options: undefined })])).toEqual([]);
        expect(sanitize([valid({ options: 'a,b,c,d' })])).toEqual([]);
    });

    it('trims each option', () => {
        const [result] = sanitize([valid({ options: [' a ', 'b  ', '  c', 'd'] })]);
        expect(result.options).toEqual(['a', 'b', 'c', 'd']);
    });

    it('coerces non-string options to strings', () => {
        const [result] = sanitize([valid({ options: [1, true, 'c', 'd'] })]);
        expect(result.options).toEqual(['1', 'true', 'c', 'd']);
    });

    it('drops blank options, which can push a five-option set down to a valid four', () => {
        const [result] = sanitize([valid({ options: ['a', '   ', 'b', 'c', 'd'] })]);
        expect(result.options).toEqual(['a', 'b', 'c', 'd']);
    });

    it('drops the question when blanks leave fewer than four', () => {
        expect(sanitize([valid({ options: ['a', '', '  ', 'd'] })])).toEqual([]);
    });

    it('treats null and undefined options as blanks rather than crashing', () => {
        // `String(o ?? '')` is what prevents "null" and "undefined" becoming
        // literal answer text.
        expect(sanitize([valid({ options: ['a', null, undefined, 'd'] })])).toEqual([]);
    });
});

describe('correctIndex', () => {
    it.each([0, 1, 2, 3])('accepts in-range index %i', (index) => {
        const [result] = sanitize([valid({ correctIndex: index })]);
        expect(result.correctIndex).toBe(index);
    });

    it('parses a numeric string index', () => {
        const [result] = sanitize([valid({ correctIndex: '2' })]);
        expect(result.correctIndex).toBe(2);
    });

    it.each([
        ['negative', -1],
        ['above range', 4],
        ['far above range', 99],
        ['non-numeric string', 'two'],
        ['null', null],
        ['undefined', undefined]
    ])('rejects %s', (_label, index) => {
        expect(sanitize([valid({ correctIndex: index })])).toEqual([]);
    });

    it('truncates a fractional index toward zero rather than rejecting it', () => {
        // Number.isInteger(2.5) is false, so it falls through to
        // parseInt(2.5, 10) -- which stringifies to '2.5' and parses to 2.
        // The question is kept with a silently altered answer key.
        const [result] = sanitize([valid({ correctIndex: 2.5 })]);
        expect(result.correctIndex).toBe(2);

        // Out-of-range fractions are still rejected after truncation.
        expect(sanitize([valid({ correctIndex: 4.9 })])).toEqual([]);
    });
});

describe('explanation', () => {
    it('trims a string explanation', () => {
        const [result] = sanitize([valid({ explanation: '  because  ' })]);
        expect(result.explanation).toBe('because');
    });

    it.each([
        ['missing', undefined],
        ['null', null],
        ['a number', 7],
        ['an object', { text: 'x' }]
    ])('normalises %s to null', (_label, explanation) => {
        const [result] = sanitize([valid({ explanation })]);
        expect(result.explanation).toBeNull();
    });
});

describe('batch behaviour', () => {
    it('keeps the valid questions and drops the invalid ones', () => {
        const result = sanitize([
            valid({ question: 'Q1' }),
            valid({ question: 'Q2', options: ['only', 'three', 'here'] }),  // dropped
            valid({ question: 'Q3', correctIndex: 9 }),                     // dropped
            valid({ question: 'Q4' })
        ]);

        expect(result.map((q: any) => q.question)).toEqual(['Q1', 'Q4']);
    });

    it('returns only the four expected keys, discarding anything extra', () => {
        const [result] = sanitize([valid({ id: 'injected', difficulty: 'hard' } as any)]);

        // Whatever the model volunteers, only these reach the database.
        expect(Object.keys(result).sort()).toEqual(['correctIndex', 'explanation', 'options', 'question']);
    });

    it('does not mutate the input objects', () => {
        const input = [valid({ question: '  padded  ' })];
        const snapshot = JSON.parse(JSON.stringify(input));

        sanitize(input);

        expect(input).toEqual(snapshot);
    });
});
