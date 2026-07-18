/**
 * Deterministic seeded shuffle helpers.
 *
 * Used by the quiz flow so the server can:
 *   1. Pick a random `shuffle_seed` per attempt and store it.
 *   2. Permute each question's options before sending them to the player —
 *      hiding the original `correct_index`.
 *   3. On submit, regenerate the same permutation from the stored seed,
 *      map the player's `selected_index` (in shuffled space) back to the
 *      original space, and compare with the stored `correct_index`.
 *
 * No state leaves the server other than the seed (an opaque integer) being
 * stored against the attempt row.
 */

/** mulberry32: tiny seeded PRNG that returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
    let s = seed >>> 0;
    return function () {
        s |= 0;
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** FNV-1a 32-bit hash → used to derive a sub-seed per question from the master. */
export function hashStringToInt(str: any): number {
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

export function deriveSeed(masterSeed: number, key: any): number {
    return ((masterSeed >>> 0) ^ hashStringToInt(key)) >>> 0;
}

export function fisherYates<T>(array: T[], rng: () => number): T[] {
    const out = [...array];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

export function seededShuffle<T>(array: T[], seed: number): T[] {
    return fisherYates(array, mulberry32(seed));
}

/**
 * Return a permutation of [0..length-1] such that
 *   shuffledArray[i] === originalArray[permutation[i]]
 *
 * The same `seed` always returns the same permutation, so it can be
 * regenerated on submit without storing the permutation itself.
 */
export function seededIndexPermutation(length: number, seed: number): number[] {
    const indices = Array.from({ length }, (_, i) => i);
    return seededShuffle(indices, seed);
}

/** Generate a random 32-bit unsigned integer for storage as the master seed. */
export function randomSeed(): number {
    return Math.floor(Math.random() * 0x100000000) >>> 0;
}
