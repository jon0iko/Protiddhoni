/**
 * The generation language is a ROUND setting, not a per-click toggle.
 *
 * It previously existed only as transient UI state on the "generate more"
 * toolbar, so regenerating a round always fell back to Bengali — an English or
 * mixed round quietly started producing Bengali questions on its second batch.
 * These tests pin the language down at both ends: the prompt the model receives,
 * and the fallback the regenerate endpoint picks.
 */

import aiQuizService from '../../services/aiQuizService';

const LANGUAGES = ['bn', 'en', 'mixed'] as const;

/** Mirrors the fallback chain in quizController.regenerateQuestions. */
function resolveLanguage(bodyLanguage: any, quizLanguage: any): string {
    return LANGUAGES.includes(bodyLanguage)
        ? bodyLanguage
        : (LANGUAGES.includes(quizLanguage) ? quizLanguage : 'bn');
}

describe('quiz generation language', () => {
    describe('regenerate language resolution', () => {
        test('uses the round language when the request does not override it', () => {
            expect(resolveLanguage(undefined, 'en')).toBe('en');
            expect(resolveLanguage(undefined, 'mixed')).toBe('mixed');
            expect(resolveLanguage(undefined, 'bn')).toBe('bn');
        });

        test('an explicit request language still wins', () => {
            expect(resolveLanguage('en', 'bn')).toBe('en');
            expect(resolveLanguage('mixed', 'en')).toBe('mixed');
        });

        test('falls back to Bengali only when neither is valid', () => {
            expect(resolveLanguage('klingon', null)).toBe('bn');
            expect(resolveLanguage(undefined, undefined)).toBe('bn');
        });
    });

    describe('prompt construction', () => {
        const originalKey = process.env.WANDB_API_KEY;
        let capturedBody: any;

        beforeEach(() => {
            process.env.WANDB_API_KEY = 'test-key';
            (aiQuizService as any).apiKey = 'test-key';
            capturedBody = undefined;

            global.fetch = jest.fn(async (_url: any, init: any) => {
                capturedBody = JSON.parse(init.body);
                return {
                    ok: true,
                    json: async () => ({
                        choices: [
                            {
                                message: {
                                    content: JSON.stringify({
                                        questions: [
                                            {
                                                question: 'Q?',
                                                options: ['a', 'b', 'c', 'd'],
                                                correctIndex: 0,
                                                explanation: 'because'
                                            }
                                        ]
                                    })
                                }
                            }
                        ]
                    })
                };
            }) as any;
        });

        afterEach(() => {
            process.env.WANDB_API_KEY = originalKey;
            (aiQuizService as any).apiKey = originalKey;
            jest.restoreAllMocks();
        });

        const promptText = () =>
            capturedBody.messages.map((m: any) => m.content).join('\n');

        test('instructs the model to write in Bengali', async () => {
            await aiQuizService.generateQuizQuestions({ title: 'T', topic: 'x', language: 'bn' });
            expect(promptText()).toContain('Bengali');
            expect(promptText()).not.toContain('all questions, options, and explanations in English');
        });

        test('instructs the model to write in English', async () => {
            await aiQuizService.generateQuizQuestions({ title: 'T', topic: 'x', language: 'en' });
            expect(promptText()).toContain('Write all questions, options, and explanations in English');
        });

        test('instructs the model to mix both languages', async () => {
            await aiQuizService.generateQuizQuestions({ title: 'T', topic: 'x', language: 'mixed' });
            expect(promptText()).toContain('natural mix of Bengali');
        });

        test('admin instructions are carried alongside the language directive', async () => {
            await aiQuizService.generateQuizQuestions({
                title: 'T',
                topic: 'x',
                language: 'en',
                instructions: 'Exclude anything by Tagore.'
            });
            const prompt = promptText();
            expect(prompt).toContain('Write all questions, options, and explanations in English');
            expect(prompt).toContain('Exclude anything by Tagore.');
        });
    });
});
