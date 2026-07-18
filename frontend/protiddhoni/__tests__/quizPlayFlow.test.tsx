/**
 * Regression tests for the per-question quiz flow.
 *
 * The bug these pin down: the final submit sent a STALE `answers` map, so a
 * player who answered correctly was graded as having answered nothing. It only
 * showed up on the last question, because that is the only path that submits.
 */
import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';

const mockSubmit = jest.fn();
const mockStart = jest.fn();
const mockGetPreview = jest.fn();
const mockEnter = jest.fn();
const mockGetAttempt = jest.fn();
const mockQuizLeaderboard = jest.fn();

jest.mock('next/navigation', () => ({
    useParams: () => ({ id: 'quiz-1' }),
    useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1', username: 'tester' },
        isLoggedIn: true,
        isLoading: false,
        refreshBalance: jest.fn(),
    }),
}));

jest.mock('@/lib/api', () => ({
    api: {
        quizzes: {
            getPreview: (...a: any[]) => mockGetPreview(...a),
            enter: (...a: any[]) => mockEnter(...a),
            start: (...a: any[]) => mockStart(...a),
            submit: (...a: any[]) => mockSubmit(...a),
            getAttempt: (...a: any[]) => mockGetAttempt(...a),
            quizLeaderboard: (...a: any[]) => mockQuizLeaderboard(...a),
        },
    },
}));

import PlayQuizPage from '@/app/quizzes/[id]/page';

/** Three questions, 30s each, player already paid in and can press Start. */
const QUESTIONS = [
    { id: 'q1', position: 0, question_text: 'Question one?', options: ['1A', '1B', '1C', '1D'], language: 'en' },
    { id: 'q2', position: 1, question_text: 'Question two?', options: ['2A', '2B', '2C', '2D'], language: 'en' },
    { id: 'q3', position: 2, question_text: 'Question three?', options: ['3A', '3B', '3C', '3D'], language: 'en' },
];

function primeMocks() {
    jest.clearAllMocks();

    mockGetPreview.mockResolvedValue({
        success: true,
        data: {
            quiz: {
                id: 'quiz-1',
                title: 'Test Round',
                difficulty: 'medium',
                entry_cost: 5,
                total_questions: 3,
                quiz_type: 'general',
                phase: 'open',
                prize_pool: 30,
                base_pool: 11,
                rake_bps: 0,
                status: 'published',
                closes_at: new Date(Date.now() + 3600_000).toISOString(),
                time_limit_seconds: 90,
                seconds_per_question: 30,
            },
            // Already entered, so the lobby shows Start rather than Confirm entry.
            user_attempt: { id: 'attempt-1', status: 'entered', score: 0, correct_answers: 0, kori_spent: 5, kori_earned: 0 },
        },
    });

    mockQuizLeaderboard.mockResolvedValue({ success: true, data: [] });

    mockStart.mockResolvedValue({
        success: true,
        data: {
            attempt_id: 'attempt-1',
            resumed: false,
            started_at: new Date().toISOString(),
            quiz: { id: 'quiz-1', title: 'Test Round', total_questions: 3, time_limit_seconds: 90, seconds_per_question: 30 },
            questions: QUESTIONS,
        },
    });

    mockSubmit.mockResolvedValue({
        success: true,
        data: {
            attempt: { id: 'attempt-1', score: 3, kori_spent: 5, completed_at: new Date().toISOString() },
            correct_answers: 3,
            total_questions: 3,
            kori_earned: 0,
            payout_pending: true,
            review: [],
        },
    });
}

/** Click and let any resulting state updates flush. */
async function click(el: HTMLElement) {
    await act(async () => {
        fireEvent.click(el);
    });
}

async function startPlaying() {
    render(<PlayQuizPage />);
    const startBtn = await screen.findByRole('button', { name: /শুরু করুন|Start/i });
    await click(startBtn);
    await screen.findByText('Question one?');
}

describe('quiz play flow — answers reach the server', () => {
    beforeEach(primeMocks);

    it('submits every selected answer, not a stale snapshot', async () => {
        await startPlaying();

        // Answer q1, advance; answer q2, advance; answer q3, submit.
        await click(screen.getByText('1B'));
        await click(screen.getByRole('button', { name: /পরবর্তী/ }));

        await screen.findByText('Question two?');
        await click(screen.getByText('2C'));
        await click(screen.getByRole('button', { name: /পরবর্তী/ }));

        await screen.findByText('Question three?');
        await click(screen.getByText('3A'));
        await click(screen.getByRole('button', { name: /জমা দিন/ }));

        await waitFor(() => expect(mockSubmit).toHaveBeenCalled());

        const [, payload] = mockSubmit.mock.calls[0];
        // The regression: this arrived as [], so a perfect run scored zero.
        expect(payload.answers).toEqual([
            { question_id: 'q1', selected_index: 1 },
            { question_id: 'q2', selected_index: 2 },
            { question_id: 'q3', selected_index: 0 },
        ]);
    });

    it('keeps answers when the per-question timer forces the advance', async () => {
        jest.useFakeTimers({ doNotFake: ['performance'] });
        try {
            await startPlaying();

            await click(screen.getByText('1B'));
            // Let q1's 30s clock expire instead of pressing Next.
            await act(async () => {
                jest.advanceTimersByTime(31_000);
            });

            await screen.findByText('Question two?');
            await click(screen.getByText('2C'));
            await act(async () => {
                jest.advanceTimersByTime(31_000);
            });

            await screen.findByText('Question three?');
            await click(screen.getByText('3A'));
            await act(async () => {
                jest.advanceTimersByTime(31_000);
            });

            await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
            const [, payload] = mockSubmit.mock.calls[0];
            expect(payload.answers).toEqual([
                { question_id: 'q1', selected_index: 1 },
                { question_id: 'q2', selected_index: 2 },
                { question_id: 'q3', selected_index: 0 },
            ]);
        } finally {
            jest.useRealTimers();
        }
    });

    it('submits exactly once even if Next races the expiring timer', async () => {
        await startPlaying();

        await click(screen.getByText('1B'));
        await click(screen.getByRole('button', { name: /পরবর্তী/ }));
        await screen.findByText('Question two?');
        await click(screen.getByText('2C'));
        await click(screen.getByRole('button', { name: /পরবর্তী/ }));

        await screen.findByText('Question three?');
        await click(screen.getByText('3A'));
        const submitBtn = screen.getByRole('button', { name: /জমা দিন/ });
        await click(submitBtn);
        await click(submitBtn);

        await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
        expect(mockSubmit).toHaveBeenCalledTimes(1);
    });
});
