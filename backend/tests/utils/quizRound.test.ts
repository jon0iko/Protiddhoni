/**
 * Round phase derivation for scheduled competitive quizzes.
 *
 * Arrived on main with the quiz-rounds feature, untested. It is worth covering
 * properly rather than waiving, because the phase is never stored --- it is
 * re-derived on every read, so this function alone decides whether a round
 * accepts entries, whether a prize pool still owes a payout, and whether a
 * settled round can be reopened. Every branch is pure and the clock is
 * injectable, so none of this needs mocks.
 */

import { deriveRoundPhase, isSettlementDue, secondsUntil, type RoundTimings } from '../../utils/quizRound';

const NOW = new Date('2026-06-15T12:00:00Z');
const past = '2026-06-15T11:00:00Z';
const future = '2026-06-15T13:00:00Z';

const round = (over: RoundTimings = {}): RoundTimings => ({
    status: 'published',
    opens_at: past,
    closes_at: future,
    settled_at: null,
    ...over
});

describe('deriveRoundPhase', () => {
    it('is draft for a missing round', () => {
        expect(deriveRoundPhase(null, NOW)).toBe('draft');
        expect(deriveRoundPhase(undefined, NOW)).toBe('draft');
    });

    it('is draft while the quiz is unpublished, whatever the window says', () => {
        expect(deriveRoundPhase(round({ status: 'draft' }), NOW)).toBe('draft');
        expect(deriveRoundPhase(round({ status: 'archived' }), NOW)).toBe('draft');
        expect(deriveRoundPhase(round({ status: null }), NOW)).toBe('draft');
    });

    it('is scheduled when the window has not opened', () => {
        expect(deriveRoundPhase(round({ opens_at: future, closes_at: null }), NOW)).toBe('scheduled');
    });

    it('is open inside the window', () => {
        expect(deriveRoundPhase(round(), NOW)).toBe('open');
    });

    it('is open when no window is configured at all', () => {
        expect(deriveRoundPhase(round({ opens_at: null, closes_at: null }), NOW)).toBe('open');
    });

    it('is closed once the deadline has passed', () => {
        expect(deriveRoundPhase(round({ closes_at: past }), NOW)).toBe('closed');
    });

    it('settlement is terminal and outranks every other signal', () => {
        // A settled round must never reopen, even if someone edits the window
        // or unpublishes the quiz afterwards.
        expect(deriveRoundPhase(round({ settled_at: past }), NOW)).toBe('settled');
        expect(deriveRoundPhase(round({ settled_at: past, status: 'draft' }), NOW)).toBe('settled');
        expect(deriveRoundPhase(round({ settled_at: past, opens_at: future }), NOW)).toBe('settled');
    });

    describe('boundary instants', () => {
        it('opens exactly at opens_at', () => {
            // The comparison is `now < opensAt`, so the opening tick is inclusive.
            expect(deriveRoundPhase(round({ opens_at: NOW.toISOString() }), NOW)).toBe('open');
        });

        it('closes exactly at closes_at', () => {
            // The comparison is `now >= closesAt`, so the closing tick is exclusive.
            expect(deriveRoundPhase(round({ closes_at: NOW.toISOString() }), NOW)).toBe('closed');
        });

        it('is still open one millisecond before closing', () => {
            const oneMsBefore = new Date(NOW.getTime() + 1).toISOString();
            expect(deriveRoundPhase(round({ closes_at: oneMsBefore }), NOW)).toBe('open');
        });
    });

    describe('date coercion', () => {
        it('accepts Date objects as well as ISO strings', () => {
            expect(deriveRoundPhase(round({ opens_at: new Date(future) }), NOW)).toBe('scheduled');
            expect(deriveRoundPhase(round({ closes_at: new Date(past) }), NOW)).toBe('closed');
            expect(deriveRoundPhase(round({ settled_at: new Date(past) }), NOW)).toBe('settled');
        });

        it('treats an unparseable timestamp as absent rather than throwing', () => {
            // An invalid date parses to NaN; toTime maps that to null so the
            // round degrades to "no deadline" instead of crashing the endpoint.
            expect(deriveRoundPhase(round({ closes_at: 'not-a-date' }), NOW)).toBe('open');
            expect(deriveRoundPhase(round({ settled_at: 'not-a-date' }), NOW)).toBe('open');
        });
    });

    it('defaults the clock to now when none is supplied', () => {
        expect(deriveRoundPhase(round({ opens_at: '2099-01-01T00:00:00Z' }))).toBe('scheduled');
        expect(deriveRoundPhase(round({ closes_at: '2000-01-01T00:00:00Z' }))).toBe('closed');
    });
});

describe('isSettlementDue', () => {
    it('is true for a closed round that has not been settled', () => {
        expect(isSettlementDue(round({ closes_at: past }), NOW)).toBe(true);
    });

    it('is false once the round has been settled', () => {
        // Otherwise the settlement job would pay the same winners twice.
        expect(isSettlementDue(round({ closes_at: past, settled_at: past }), NOW)).toBe(false);
    });

    it('is false while the round is still open or scheduled', () => {
        expect(isSettlementDue(round(), NOW)).toBe(false);
        expect(isSettlementDue(round({ opens_at: future }), NOW)).toBe(false);
    });

    it('is false when there is no closing deadline to be past', () => {
        expect(isSettlementDue(round({ closes_at: null }), NOW)).toBe(false);
    });

    it('is false for a missing round or an unpublished one', () => {
        expect(isSettlementDue(null, NOW)).toBe(false);
        expect(isSettlementDue(round({ closes_at: past, status: 'draft' }), NOW)).toBe(false);
    });
});

describe('secondsUntil', () => {
    it('counts down to a future instant', () => {
        expect(secondsUntil(future, NOW)).toBe(3600);
    });

    it('clamps a past instant to zero rather than going negative', () => {
        // A negative countdown would render as a negative timer in the UI.
        expect(secondsUntil(past, NOW)).toBe(0);
    });

    it('is zero at the exact instant', () => {
        expect(secondsUntil(NOW.toISOString(), NOW)).toBe(0);
    });

    it('rounds to the nearest second', () => {
        expect(secondsUntil(new Date(NOW.getTime() + 1499), NOW)).toBe(1);
        expect(secondsUntil(new Date(NOW.getTime() + 1500), NOW)).toBe(2);
    });

    it('is null when there is no deadline', () => {
        expect(secondsUntil(null, NOW)).toBeNull();
        expect(secondsUntil(undefined, NOW)).toBeNull();
        expect(secondsUntil('not-a-date', NOW)).toBeNull();
    });

    it('accepts a Date and defaults the clock to now', () => {
        expect(secondsUntil(new Date(NOW.getTime() + 120_000), NOW)).toBe(120);
        expect(secondsUntil('2000-01-01T00:00:00Z')).toBe(0);
    });
});
