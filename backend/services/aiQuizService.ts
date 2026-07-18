/**
 * AI Quiz Service
 * Generates quiz questions through W&B Serverless Inference, which exposes an
 * OpenAI-compatible `/chat/completions` endpoint in front of hosted open-weight
 * models. Only the model slug changes to swap models.
 *
 * Docs:
 *   https://docs.wandb.ai/inference/
 *   https://docs.wandb.ai/inference/models
 *
 * Auth is the plain W&B API key (https://wandb.ai/settings) as a bearer token.
 * `OpenAI-Project: <team>/<project>` is what the Python client's `project=`
 * argument sends; W&B uses it for usage attribution.
 */

import logger from '../config/logger';

const WANDB_BASE_URL = process.env.WANDB_INFERENCE_BASE_URL || 'https://api.inference.wandb.ai/v1';

// DeepSeek-V3.1 has the strongest Bengali factual recall among the models W&B
// serves, which is what these literature rounds actually lean on. Override with
// WANDB_INFERENCE_MODEL to trade quality for latency (e.g. openai/gpt-oss-120b).
const DEFAULT_MODEL = process.env.WANDB_INFERENCE_MODEL || 'deepseek-ai/DeepSeek-V3.1';

const REQUEST_TIMEOUT_MS = 180_000;

// Upper bound on admin free-text steering. Not a safety boundary — admins are
// trusted — just a guard against a pasted novel blowing out the context window.
const MAX_INSTRUCTION_CHARS = 4000;

// Hard ceiling on questions per generation call. There is no product limit on
// round length; this only stops a typo'd `question_count` from asking for a
// thousand questions in one request. Admins append with /regenerate instead.
const MAX_QUESTIONS_PER_CALL = 100;

interface GeneratedQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string | null;
}

class AiQuizService {
    private apiKey: string | undefined;
    private project: string | undefined;
    private model: string;
    private logger: typeof logger;

    constructor() {
        this.apiKey = process.env.WANDB_API_KEY;
        this.project = process.env.WANDB_PROJECT;
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
     * @returns {Promise<{questions: GeneratedQuestion[], model: string}>}
     */
    async generateQuizQuestions({
        title,
        topic,
        quizType = 'general',
        examCategory,
        questionCount = 5,
        difficulty = 'medium',
        language = 'bn',
        instructions
    }: {
        title: string;
        topic?: string | null;
        quizType?: 'general' | 'exam';
        examCategory?: string | null;
        questionCount?: number;
        difficulty?: 'easy' | 'medium' | 'hard';
        language?: 'bn' | 'en' | 'mixed';
        instructions?: string | null;
    }) {
        if (!this.isConfigured()) {
            throw new Error('WANDB_API_KEY is not configured on the server');
        }

        const count = Math.min(
            Math.max(parseInt(String(questionCount), 10) || 5, 1),
            MAX_QUESTIONS_PER_CALL
        );
        const resolvedTopic = (topic && String(topic).trim()) || title;
        const steering = (instructions && String(instructions).trim().slice(0, MAX_INSTRUCTION_CHARS)) || '';

        const languageInstruction = language === 'mixed'
            ? 'Write a natural mix of Bengali (বাংলা) and English questions — roughly half in each. Every option and explanation must be in the same language as its own question.'
            : language === 'en'
                ? 'Write all questions, options, and explanations in English.'
                : 'Write all questions, options, and explanations in Bengali (বাংলা).';

        const styleInstruction = quizType === 'exam'
            ? `Write questions in the style of previously-asked ${examCategory || 'competitive recruitment'} recruitment exam questions on Bangla/English literature. Mirror the phrasing, length, and factual density typical of that exam's literature section.`
            : `Write general literary-knowledge questions on the topic: ${resolvedTopic}.`;

        const userPrompt = [
            `You are an exam writer creating a ${difficulty} difficulty multiple-choice quiz titled "${title}".`,
            `Produce exactly ${count} questions.`,
            styleInstruction,
            'Each question must have exactly 4 options, with one and only one correct answer.',
            'Mark the correct option using a zero-based `correctIndex` (0, 1, 2, or 3).',
            'Spread the correct answers across all four positions — do not put the answer at the same index every time.',
            'Every question must be verifiable, factual, and unambiguous. Avoid trick questions, opinion-based questions, and anything that depends on current events.',
            'Do not repeat the same fact across two questions.',
            'Include a short explanation stating why the marked option is correct.',
            languageInstruction,
            '',
            `TOPIC: ${resolvedTopic}`,
            // The admin's steering goes last so it wins over the generic rules
            // above when the two conflict — that is the point of the field.
            ...(steering
                ? [
                    '',
                    'ADDITIONAL INSTRUCTIONS FROM THE QUIZ EDITOR — follow these closely, and',
                    'prefer them over the general guidance above wherever they disagree:',
                    steering
                ]
                : []),
            '',
            'Respond with a single JSON object and nothing else, in exactly this shape:',
            '{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}'
        ].join('\n');

        const messages = [
            {
                role: 'system',
                content: 'You are a meticulous quiz author. You reply with raw JSON only — no prose, no markdown code fences, no commentary before or after the JSON.'
            },
            { role: 'user', content: userPrompt }
        ];

        const text = await this._complete(messages);

        let parsed: any;
        try {
            parsed = JSON.parse(this._extractJson(text));
        } catch (err) {
            this.logger.error('Failed to parse AI JSON response:', text);
            throw new Error('The AI model returned malformed JSON');
        }

        const questions = this._sanitizeQuestions(parsed?.questions);
        if (!questions.length) {
            throw new Error('The AI model returned no usable questions');
        }

        return { questions, model: this.model };
    }

    /**
     * POST to the OpenAI-compatible chat completions endpoint and return the
     * assistant's message content.
     */
    private async _complete(messages: Array<{ role: string; content: string }>): Promise<string> {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
        if (this.project) {
            headers['OpenAI-Project'] = this.project;
        }

        const body = {
            model: this.model,
            messages,
            temperature: 0.4,
            // No max_tokens: rounds are no longer capped at 15 questions, and any
            // fixed ceiling truncates mid-JSON on a long Bengali round (Bengali
            // runs ~3x the tokens of the equivalent English). Letting the model
            // stop on its own is what keeps the payload parseable.
            // vLLM-backed W&B models honour json_object; the prompt still spells
            // out the schema so a model that ignores it stays parseable.
            response_format: { type: 'json_object' }
        };

        const response = await fetch(`${WANDB_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });

        if (!response.ok) {
            const errText = await response.text();
            this.logger.error(`W&B Inference error ${response.status}: ${errText}`);
            throw new Error(`AI question generation failed (${response.status})`);
        }

        const payload: any = await response.json();
        const text = payload?.choices?.[0]?.message?.content;
        if (!text || !String(text).trim()) {
            this.logger.error('W&B Inference returned no content:', JSON.stringify(payload));
            throw new Error('The AI model returned an empty response');
        }

        return String(text);
    }

    /**
     * Pull the JSON object out of a model reply. Reasoning-capable models can
     * prefix a `<think>` block, and chat-tuned models like to wrap output in
     * ```json fences even when told not to.
     */
    private _extractJson(text: string): string {
        let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced) {
            cleaned = fenced[1].trim();
        }

        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end > start) {
            cleaned = cleaned.slice(start, end + 1);
        }

        return cleaned;
    }

    _sanitizeQuestions(rawQuestions): GeneratedQuestion[] {
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

export default new AiQuizService();
