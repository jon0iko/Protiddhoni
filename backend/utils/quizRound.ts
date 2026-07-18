/**
 * Round phase derivation for scheduled competitive quizzes.
 *
 * A round's phase is never stored — it is always derived from
 * (status, opens_at, closes_at, settled_at) so the DB and the API can never
 * disagree about what state a round is in.
 *
 *   draft     — not published yet (or archived)
 *   scheduled — published, but opens_at is in the future
 *   open      — inside the window; players may enter and play
 *   closed    — past closes_at but not yet settled; payouts are pending
 *   settled   — winners have been paid; frozen forever
 */

export type RoundPhase = 'draft' | 'scheduled' | 'open' | 'closed' | 'settled';

export interface RoundTimings {
    status?: string | null;
    opens_at?: string | Date | null;
    closes_at?: string | Date | null;
    settled_at?: string | Date | null;
}

function toTime(value: string | Date | null | undefined): number | null {
    if (value == null) return null;
    const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
}

export function deriveRoundPhase(quiz: RoundTimings | null | undefined, now: Date = new Date()): RoundPhase {
    if (!quiz) return 'draft';

    // Settlement is terminal — a settled round is settled whatever the clock says.
    if (toTime(quiz.settled_at) != null) return 'settled';

    if (quiz.status !== 'published') return 'draft';

    const nowMs = now.getTime();
    const opensAt = toTime(quiz.opens_at);
    const closesAt = toTime(quiz.closes_at);

    if (opensAt != null && nowMs < opensAt) return 'scheduled';
    if (closesAt != null && nowMs >= closesAt) return 'closed';

    return 'open';
}

/** True when the round is past its window and still owes its winners a payout. */
export function isSettlementDue(quiz: RoundTimings | null | undefined, now: Date = new Date()): boolean {
    if (!quiz) return false;
    if (toTime(quiz.settled_at) != null) return false;
    if (toTime(quiz.closes_at) == null) return false;
    return deriveRoundPhase(quiz, now) === 'closed';
}

/** Seconds remaining until the given instant; null when there is no deadline. */
export function secondsUntil(target: string | Date | null | undefined, now: Date = new Date()): number | null {
    const targetMs = toTime(target);
    if (targetMs == null) return null;
    return Math.max(0, Math.round((targetMs - now.getTime()) / 1000));
}
