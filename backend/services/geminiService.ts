/**
 * Gemini AI Service
 * Wraps the Google Generative Language REST API for quiz question generation.
 *
 * Uses the v1beta `generateContent` endpoint with structured JSON output
 * (`generationConfig.responseMimeType` + `generationConfig.responseSchema`).
 *
 * Docs:
 *   https://ai.google.dev/gemini-api/docs/gemini-3
 *   https://ai.google.dev/gemini-api/docs/structured-output
 */

import logger from '../config/logger';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

class GeminiService {
    private apiKey: string | undefined;
    private model: string;
    private logger: typeof logger;

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.model = DEFAULT_MODEL;
        this.logger = logger;
    }

    isConfigured() {
        return Boolean(this.apiKey);
    }

    /**
     * Generate a fixed-shape JSON payload for a quiz round from a TOPIC.
     *
     * Rounds are no longer built from a pasted passage — an admin picks a round
     * type and a topic, and the model writes questions in the appropriate style.
     *
     * @param {Object} input
     * @param {string} input.title
     * @param {string} [input.topic] - Subject the questions should cover
     * @param {'general'|'exam'} [input.quizType='general']
     * @param {string} [input.examCategory] - BCS, Bank Job, ... (when quizType='exam')
     * @param {number} [input.questionCount=5]
     * @param {'easy'|'medium'|'hard'} [input.difficulty='medium']
     * @param {'bn'|'en'|'mixed'} [input.language='bn']
     * @returns {Promise<{questions: Array<{question: string, options: string[], correctIndex: number, explanation?: string}>}>}
     */
    async generateQuizQuestions({
        title,
        topic,
        quizType = 'general',
        examCategory,
        questionCount = 5,
        difficulty = 'medium',
        language = 'bn'
    }: {
        title: string;
        topic?: string | null;
        quizType?: 'general' | 'exam';
        examCategory?: string | null;
        questionCount?: number;
        difficulty?: 'easy' | 'medium' | 'hard';
        language?: 'bn' | 'en' | 'mixed';
    }) {
        if (!this.isConfigured()) {
            throw new Error('GEMINI_API_KEY is not configured on the server');
        }

        const count = Math.min(Math.max(parseInt(String(questionCount), 10) || 5, 1), 15);
        const resolvedTopic = (topic && String(topic).trim()) || title;

        const languageInstruction = language === 'mixed'
            ? 'Write a natural mix of Bengali (বাংলা) and English questions — roughly half in each. Every option and explanation must be in the same language as its own question.'
            : language === 'en'
                ? 'Write all questions, options, and explanations in English.'
                : 'Write all questions, options, and explanations in Bengali (বাংলা).';

        const styleInstruction = quizType === 'exam'
            ? `Write questions in the style of previously-asked ${examCategory || 'competitive recruitment'} recruitment exam questions on Bangla/English literature. Mirror the phrasing, length, and factual density typical of that exam's literature section.`
            : `Write general literary-knowledge questions on the topic: ${resolvedTopic}.`;

        const prompt = [
            `You are an exam writer creating a ${difficulty} difficulty multiple-choice quiz titled "${title}".`,
            `Produce exactly ${count} questions.`,
            styleInstruction,
            'Each question must have exactly 4 options, with one and only one correct answer.',
            'Mark the correct option using a zero-based `correctIndex` (0, 1, 2, or 3).',
            'Every question must be verifiable, factual, and unambiguous. Avoid trick questions, opinion-based questions, and anything that depends on current events.',
            'Do not repeat the same fact across two questions.',
            'Include a short explanation stating why the marked option is correct.',
            languageInstruction,
            '',
            `TOPIC: ${resolvedTopic}`
        ].join('\n');

        const body = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.4,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        questions: {
                            type: 'ARRAY',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    question: { type: 'STRING' },
                                    options: {
                                        type: 'ARRAY',
                                        items: { type: 'STRING' }
                                    },
                                    correctIndex: { type: 'INTEGER' },
                                    explanation: { type: 'STRING' }
                                },
                                required: ['question', 'options', 'correctIndex']
                            }
                        }
                    },
                    required: ['questions']
                }
            }
        };

        const url = `${GEMINI_ENDPOINT}/${this.model}:generateContent`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-goog-api-key': this.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            this.logger.error(`Gemini API error ${response.status}: ${errText}`);
            throw new Error(`Gemini API request failed (${response.status})`);
        }

        const payload: any = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            this.logger.error('Gemini API returned no text part:', JSON.stringify(payload));
            throw new Error('Gemini API returned an empty response');
        }

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (err) {
            this.logger.error('Failed to parse Gemini JSON response:', text);
            throw new Error('Gemini returned malformed JSON');
        }

        const questions = this._sanitizeQuestions(parsed?.questions);
        if (!questions.length) {
            throw new Error('Gemini returned no usable questions');
        }

        return { questions, model: this.model };
    }

    _sanitizeQuestions(rawQuestions) {
        if (!Array.isArray(rawQuestions)) return [];
        return rawQuestions
            .map((q) => {
                if (!q || typeof q.question !== 'string') return null;
                const options = Array.isArray(q.options)
                    ? q.options.map((o) => (typeof o === 'string' ? o.trim() : String(o ?? '').trim())).filter(Boolean)
                    : [];
                if (options.length !== 4) return null;
                const correctIndex = Number.isInteger(q.correctIndex)
                    ? q.correctIndex
                    : parseInt(q.correctIndex, 10);
                if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
                    return null;
                }
                return {
                    question: q.question.trim(),
                    options,
                    correctIndex,
                    explanation: typeof q.explanation === 'string' ? q.explanation.trim() : null
                };
            })
            .filter(Boolean);
    }
}

export default new GeminiService();
