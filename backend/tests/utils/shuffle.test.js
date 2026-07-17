/**
 * Unit Tests for the seeded shuffle utilities.
 *
 * These helpers are the backbone of quiz fairness and grading correctness:
 *   - startAttempt shuffles each question's options with a per-attempt seed and
 *     hides `correct_index`.
 *   - submitAttempt regenerates the SAME permutation from the stored seed to map
 *     the player's shuffled-space selection back to the original index and grade it.
 *
 * If the permutation were not perfectly deterministic and reversible, players
 * would be graded against the wrong answer. The round-trip test below reproduces
 * the exact controller logic and asserts it can never mis-grade.
 */

const {
    mulberry32,
    hashStringToInt,
    deriveSeed,
    fisherYates,
    seededShuffle,
    seededIndexPermutation,
    randomSeed
} = require('../../utils/shuffle');

describe('shuffle utilities', () => {
    describe('mulberry32 (seeded PRNG)', () => {
        test('returns floats in the [0, 1) range', () => {
            const rng = mulberry32(12345);
            for (let i = 0; i < 1000; i++) {
                const v = rng();
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThan(1);
            }
        });

        test('is deterministic for the same seed', () => {
            const a = mulberry32(42);
            const b = mulberry32(42);
            const seqA = Array.from({ length: 10 }, () => a());
            const seqB = Array.from({ length: 10 }, () => b());
            expect(seqA).toEqual(seqB);
        });

        test('produces different sequences for different seeds', () => {
            const a = mulberry32(1);
            const b = mulberry32(2);
            const seqA = Array.from({ length: 10 }, () => a());
            const seqB = Array.from({ length: 10 }, () => b());
            expect(seqA).not.toEqual(seqB);
        });
    });

    describe('hashStringToInt (FNV-1a)', () => {
        test('is deterministic', () => {
            expect(hashStringToInt('question-1')).toBe(hashStringToInt('question-1'));
        });

        test('differs for different inputs', () => {
            expect(hashStringToInt('question-1')).not.toBe(hashStringToInt('question-2'));
        });

        test('always returns an unsigned 32-bit integer', () => {
            for (const key of ['', 'a', 'a-very-long-key-with-symbols-!@#', '12345', '🙂']) {
                const h = hashStringToInt(key);
                expect(Number.isInteger(h)).toBe(true);
                expect(h).toBeGreaterThanOrEqual(0);
                expect(h).toBeLessThanOrEqual(0xffffffff);
            }
        });
    });

    describe('deriveSeed', () => {
        test('is deterministic for the same master seed + key', () => {
            expect(deriveSeed(999, 'q-abc')).toBe(deriveSeed(999, 'q-abc'));
        });

        test('depends on both the master seed and the key', () => {
            expect(deriveSeed(1, 'q')).not.toBe(deriveSeed(2, 'q'));
            expect(deriveSeed(1, 'qa')).not.toBe(deriveSeed(1, 'qb'));
        });
    });

    describe('fisherYates', () => {
        test('does not mutate the input array', () => {
            const input = [1, 2, 3, 4, 5];
            const copy = [...input];
            fisherYates(input, mulberry32(7));
            expect(input).toEqual(copy);
        });

        test('preserves the exact multiset of elements', () => {
            const input = ['a', 'b', 'c', 'd', 'e', 'f'];
            const out = fisherYates(input, mulberry32(7));
            expect(out).toHaveLength(input.length);
            expect([...out].sort()).toEqual([...input].sort());
        });
    });

    describe('seededIndexPermutation', () => {
        test('is deterministic for the same seed', () => {
            expect(seededIndexPermutation(4, 555)).toEqual(seededIndexPermutation(4, 555));
        });

        test('is a valid bijection over [0..length-1]', () => {
            const perm = seededIndexPermutation(4, 12345);
            expect(perm).toHaveLength(4);
            expect([...perm].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
        });

        test('handles the degenerate lengths 0 and 1', () => {
            expect(seededIndexPermutation(0, 1)).toEqual([]);
            expect(seededIndexPermutation(1, 1)).toEqual([0]);
        });
    });

    describe('seededShuffle', () => {
        test('is deterministic and preserves elements', () => {
            const arr = [10, 20, 30, 40, 50];
            const a = seededShuffle(arr, 99);
            const b = seededShuffle(arr, 99);
            expect(a).toEqual(b);
            expect([...a].sort((x, y) => x - y)).toEqual(arr);
        });
    });

    describe('randomSeed', () => {
        test('returns an unsigned 32-bit integer', () => {
            for (let i = 0; i < 50; i++) {
                const s = randomSeed();
                expect(Number.isInteger(s)).toBe(true);
                expect(s).toBeGreaterThanOrEqual(0);
                expect(s).toBeLessThanOrEqual(0xffffffff);
            }
        });
    });

    /**
     * The critical business rule: the option-shuffling round-trip must never
     * mis-grade a player's answer. This test reproduces the exact logic from
     * quizController.startAttempt (shuffle) and quizController.submitAttempt
     * (reverse-map) and proves grading is correct for every option a player
     * could have picked, across many seeds.
     */
    describe('quiz grading round-trip (fairness invariant)', () => {
        const question = {
            id: 'question-42',
            options: ['ক (correct)', 'খ', 'গ', 'ঘ'],
            correct_index: 0
        };

        function shuffleForDisplay(q, masterSeed) {
            const perm = seededIndexPermutation(q.options.length, deriveSeed(masterSeed, q.id));
            const displayedOptions = perm.map((origIdx) => q.options[origIdx]);
            return { perm, displayedOptions };
        }

        function reverseMap(q, masterSeed, selectedShuffledIndex) {
            const perm = seededIndexPermutation(q.options.length, deriveSeed(masterSeed, q.id));
            return perm[selectedShuffledIndex];
        }

        test('the option shown at each shuffled slot maps back to its original index', () => {
            for (const masterSeed of [1, 2, 7, 4242, randomSeed()]) {
                const { displayedOptions } = shuffleForDisplay(question, masterSeed);

                displayedOptions.forEach((shownText, shuffledIdx) => {
                    const originalIdx = reverseMap(question, masterSeed, shuffledIdx);
                    // The text the player clicked must equal the original option
                    // at the reverse-mapped index — otherwise grading is wrong.
                    expect(question.options[originalIdx]).toBe(shownText);
                });
            }
        });

        test('selecting the displayed correct answer is always graded correct', () => {
            for (const masterSeed of [0, 3, 88, 100000, randomSeed()]) {
                const { displayedOptions } = shuffleForDisplay(question, masterSeed);

                // Player finds the slot showing the correct option text and clicks it.
                const shuffledIdxOfCorrect = displayedOptions.indexOf(question.options[question.correct_index]);
                const mappedOriginal = reverseMap(question, masterSeed, shuffledIdxOfCorrect);

                expect(mappedOriginal).toBe(question.correct_index);
            }
        });

        test('selecting any wrong displayed answer is always graded incorrect', () => {
            for (const masterSeed of [5, 17, 900, 55555]) {
                const { displayedOptions } = shuffleForDisplay(question, masterSeed);

                displayedOptions.forEach((shownText, shuffledIdx) => {
                    if (shownText === question.options[question.correct_index]) return;
                    const mappedOriginal = reverseMap(question, masterSeed, shuffledIdx);
                    expect(mappedOriginal).not.toBe(question.correct_index);
                });
            }
        });
    });
});
