/**
 * QuizRepository leaderboards.
 *
 * globalLeaderboard() is the largest block of pure JS aggregation in the
 * repository layer -- everything after the query is grouping, a three-level
 * tie-break, and rank assignment. None of it was covered, and all of it is
 * player-visible, so a silent regression here is the kind users report and
 * nobody can reproduce.
 */

jest.mock('../../config/database');

import QuizRepository from '../../repositories/QuizRepository';
import { queryChain, mockDb, useClient, supabaseClient } from '../helpers/supabaseMock';

beforeEach(() => {
    jest.clearAllMocks();
});

const user = (id: string) => ({ id, username: id, full_name: id.toUpperCase(), profile_picture_url: null });

const attempt = (over: Record<string, any> = {}) => ({
    user_id: 'u1',
    score: 10,
    correct_answers: 5,
    kori_earned: 2,
    duration_ms: 30_000,
    completed_at: '2026-05-01T00:00:00Z',
    user: user('u1'),
    ...over
});

const withAttempts = (rows: any[]) =>
    mockDb({ tables: { quiz_attempts: { data: rows, error: null } } });

describe('globalLeaderboard() -- aggregation', () => {
    it('groups multiple attempts by user', async () => {
        withAttempts([
            attempt({ user_id: 'u1', score: 10, correct_answers: 5, kori_earned: 2 }),
            attempt({ user_id: 'u1', score: 6, correct_answers: 3, kori_earned: 1 })
        ]);

        const [entry] = await QuizRepository.globalLeaderboard();

        expect(entry.gamesPlayed).toBe(2);
        expect(entry.totalScore).toBe(16);
        expect(entry.totalCorrect).toBe(8);
        expect(entry.totalKori).toBe(3);
    });

    it('tracks best single score separately from the running total', async () => {
        withAttempts([
            attempt({ score: 4 }),
            attempt({ score: 19 }),
            attempt({ score: 7 })
        ]);

        const [entry] = await QuizRepository.globalLeaderboard();

        expect(entry.totalScore).toBe(30);
        expect(entry.bestScore).toBe(19);
    });

    it('coerces string kori amounts and treats missing values as zero', async () => {
        withAttempts([
            attempt({ kori_earned: '2.5', score: null, correct_answers: null }),
            attempt({ kori_earned: null })
        ]);

        const [entry] = await QuizRepository.globalLeaderboard();

        expect(entry.totalKori).toBe(2.5);
        expect(entry.totalScore).toBe(10);   // null + 10
        expect(entry.totalCorrect).toBe(5);
    });

    it('averages durations and rounds to a whole millisecond', async () => {
        withAttempts([
            attempt({ duration_ms: 10_000 }),
            attempt({ duration_ms: 15_001 })
        ]);

        const [entry] = await QuizRepository.globalLeaderboard();
        expect(entry.avgDurationMs).toBe(12_501); // (10000 + 15001) / 2 = 12500.5 -> 12501
    });

    it('excludes non-finite durations from the average rather than counting them as zero', async () => {
        withAttempts([
            attempt({ duration_ms: 20_000 }),
            attempt({ duration_ms: null }),
            attempt({ duration_ms: undefined })
        ]);

        const [entry] = await QuizRepository.globalLeaderboard();

        // Counting the nulls would give ~6667 and unfairly flatter this player.
        expect(entry.avgDurationMs).toBe(20_000);
        expect(entry.gamesPlayed).toBe(3);
    });

    it('reports a null average when no attempt has a duration', async () => {
        withAttempts([attempt({ duration_ms: null })]);

        const [entry] = await QuizRepository.globalLeaderboard();
        expect(entry.avgDurationMs).toBeNull();
    });

    it('strips the internal duration accumulators from the payload', async () => {
        withAttempts([attempt()]);

        const [entry] = await QuizRepository.globalLeaderboard();

        expect(entry).not.toHaveProperty('_durationSum');
        expect(entry).not.toHaveProperty('_durationCount');
    });
});

describe('globalLeaderboard() -- ordering', () => {
    it('ranks by total score descending', async () => {
        withAttempts([
            attempt({ user_id: 'low', score: 5, user: user('low') }),
            attempt({ user_id: 'high', score: 50, user: user('high') }),
            attempt({ user_id: 'mid', score: 25, user: user('mid') })
        ]);

        const board = await QuizRepository.globalLeaderboard();
        expect(board.map((e: any) => e.user.id)).toEqual(['high', 'mid', 'low']);
    });

    it('breaks a score tie on total Kori', async () => {
        withAttempts([
            attempt({ user_id: 'a', score: 10, kori_earned: 1, user: user('a') }),
            attempt({ user_id: 'b', score: 10, kori_earned: 9, user: user('b') })
        ]);

        const board = await QuizRepository.globalLeaderboard();
        expect(board.map((e: any) => e.user.id)).toEqual(['b', 'a']);
    });

    it('breaks a score+Kori tie on the faster average duration', async () => {
        withAttempts([
            attempt({ user_id: 'slow', score: 10, kori_earned: 1, duration_ms: 90_000, user: user('slow') }),
            attempt({ user_id: 'fast', score: 10, kori_earned: 1, duration_ms: 10_000, user: user('fast') })
        ]);

        const board = await QuizRepository.globalLeaderboard();
        expect(board.map((e: any) => e.user.id)).toEqual(['fast', 'slow']);
    });

    it('sorts players with no recorded duration last', async () => {
        withAttempts([
            attempt({ user_id: 'unknown', score: 10, kori_earned: 1, duration_ms: null, user: user('unknown') }),
            attempt({ user_id: 'timed', score: 10, kori_earned: 1, duration_ms: 60_000, user: user('timed') })
        ]);

        // `?? Infinity` is what pushes them down instead of letting null sort first.
        const board = await QuizRepository.globalLeaderboard();
        expect(board.map((e: any) => e.user.id)).toEqual(['timed', 'unknown']);
    });

    it('assigns rank AFTER slicing, so the top of the page is rank 1', async () => {
        withAttempts([
            attempt({ user_id: 'a', score: 30, user: user('a') }),
            attempt({ user_id: 'b', score: 20, user: user('b') }),
            attempt({ user_id: 'c', score: 10, user: user('c') })
        ]);

        const board = await QuizRepository.globalLeaderboard({ limit: 2 });

        expect(board).toHaveLength(2);
        expect(board.map((e: any) => e.rank)).toEqual([1, 2]);
        expect(board.map((e: any) => e.user.id)).toEqual(['a', 'b']);
    });

    it('returns an empty board for no attempts or a null payload', async () => {
        withAttempts([]);
        await expect(QuizRepository.globalLeaderboard()).resolves.toEqual([]);

        mockDb({ tables: { quiz_attempts: { data: null, error: null } } });
        await expect(QuizRepository.globalLeaderboard()).resolves.toEqual([]);
    });
});

describe('globalLeaderboard() -- query shape', () => {
    it('only counts completed attempts and caps the scan at 1000 rows', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { quiz_attempts: chain } }));

        await QuizRepository.globalLeaderboard();

        // In-progress attempts must never reach the board.
        expect(chain.eq).toHaveBeenCalledWith('status', 'completed');
        // Documents a real ceiling: past 1000 completed attempts the board is
        // computed from a truncated window, not the full history.
        expect(chain.limit).toHaveBeenCalledWith(1000);
    });

    it('throws when the query errors', async () => {
        mockDb({ tables: { quiz_attempts: { data: null, error: { message: 'boom' } } } });
        await expect(QuizRepository.globalLeaderboard()).rejects.toEqual({ message: 'boom' });
    });
});

describe('quizLeaderboard()', () => {
    it('ranks in the order the database returned', async () => {
        mockDb({
            tables: {
                quiz_attempts: {
                    data: [{ id: 'a1', score: 10 }, { id: 'a2', score: 8 }],
                    error: null
                }
            }
        });

        const board = await QuizRepository.quizLeaderboard('quiz-1');

        expect(board).toEqual([
            { rank: 1, id: 'a1', score: 10 },
            { rank: 2, id: 'a2', score: 8 }
        ]);
    });

    it('scopes to the quiz, completed only, best score then fastest', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { quiz_attempts: chain } }));

        await QuizRepository.quizLeaderboard('quiz-1', { limit: 5 });

        expect(chain.eq).toHaveBeenCalledWith('quiz_id', 'quiz-1');
        expect(chain.eq).toHaveBeenCalledWith('status', 'completed');
        expect(chain.order).toHaveBeenCalledWith('score', { ascending: false });
        expect(chain.order).toHaveBeenCalledWith('duration_ms', { ascending: true, nullsFirst: false });
        expect(chain.limit).toHaveBeenCalledWith(5);
    });

    it('gives tied players distinct sequential ranks', async () => {
        mockDb({
            tables: {
                quiz_attempts: { data: [{ id: 'a', score: 10 }, { id: 'b', score: 10 }], error: null }
            }
        });

        const board = await QuizRepository.quizLeaderboard('quiz-1');
        expect(board.map((e: any) => e.rank)).toEqual([1, 2]);
    });

    it('returns [] for a null payload and throws on error', async () => {
        mockDb({ tables: { quiz_attempts: { data: null, error: null } } });
        await expect(QuizRepository.quizLeaderboard('quiz-1')).resolves.toEqual([]);

        mockDb({ tables: { quiz_attempts: { data: null, error: { message: 'boom' } } } });
        await expect(QuizRepository.quizLeaderboard('quiz-1')).rejects.toEqual({ message: 'boom' });
    });
});

describe('findQuestionsByQuizId() -- answer-key exposure', () => {
    it('omits correct_index and explanation by default', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { quiz_questions: chain } }));

        await QuizRepository.findQuestionsByQuizId('quiz-1');

        const columns = chain.select.mock.calls[0][0];
        // If correct_index ever leaks into the default column list, every player
        // can read the answer key straight off the network tab.
        expect(columns).not.toContain('correct_index');
        expect(columns).not.toContain('explanation');
    });

    it('includes them only when explicitly requested', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { quiz_questions: chain } }));

        await QuizRepository.findQuestionsByQuizId('quiz-1', { includeAnswers: true });

        const columns = chain.select.mock.calls[0][0];
        expect(columns).toContain('correct_index');
        expect(columns).toContain('explanation');
    });

    it('returns questions in position order', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { quiz_questions: chain } }));

        await QuizRepository.findQuestionsByQuizId('quiz-1');

        expect(chain.eq).toHaveBeenCalledWith('quiz_id', 'quiz-1');
        expect(chain.order).toHaveBeenCalledWith('position', { ascending: true });
    });
});

describe('replaceQuestions() -- delete then insert', () => {
    it('maps the caller shape onto database columns with positions', async () => {
        const del = queryChain({ data: null, error: null });
        const ins = queryChain({ data: [{ id: 'q1' }], error: null });
        useClient(supabaseClient({ tables: { quiz_questions: [del, ins] } }));

        await QuizRepository.replaceQuestions('quiz-1', [
            { question: 'Q1?', options: ['a', 'b', 'c', 'd'], correctIndex: 2, explanation: 'because' },
            { question: 'Q2?', options: ['w', 'x', 'y', 'z'], correctIndex: 0 }
        ]);

        expect(ins.insert).toHaveBeenCalledWith([
            { quiz_id: 'quiz-1', position: 0, question_text: 'Q1?', options: ['a', 'b', 'c', 'd'], correct_index: 2, explanation: 'because' },
            { quiz_id: 'quiz-1', position: 1, question_text: 'Q2?', options: ['w', 'x', 'y', 'z'], correct_index: 0, explanation: null }
        ]);
    });

    it('an empty question list wipes existing rows and inserts nothing', async () => {
        const del = queryChain({ data: null, error: null });
        useClient(supabaseClient({ tables: { quiz_questions: [del] } }));

        // The delete happens BEFORE the length check, so this is destructive.
        await expect(QuizRepository.replaceQuestions('quiz-1', [])).resolves.toEqual([]);
        expect(del.delete).toHaveBeenCalled();
    });

    it('does not insert when the delete fails', async () => {
        const del = queryChain({ data: null, error: { message: 'delete failed' } });
        useClient(supabaseClient({ tables: { quiz_questions: [del] } }));

        await expect(QuizRepository.replaceQuestions('quiz-1', [
            { question: 'Q', options: ['a', 'b', 'c', 'd'], correctIndex: 0 }
        ])).rejects.toEqual({ message: 'delete failed' });

        expect(del.insert).not.toHaveBeenCalled();
    });

    it('propagates an insert failure', async () => {
        const del = queryChain({ data: null, error: null });
        const ins = queryChain({ data: null, error: { message: 'insert failed' } });
        useClient(supabaseClient({ tables: { quiz_questions: [del, ins] } }));

        await expect(QuizRepository.replaceQuestions('quiz-1', [
            { question: 'Q', options: ['a', 'b', 'c', 'd'], correctIndex: 0 }
        ])).rejects.toEqual({ message: 'insert failed' });
    });
});
