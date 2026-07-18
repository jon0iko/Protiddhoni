// Application Types for Protiddhoni

export interface User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    bio?: string;
    profile_picture_url?: string;
    is_admin: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface Content {
    id: string;
    author_id: string;
    title: string;
    slug: string;
    content_type: 'story' | 'poem' | 'chapter';
    body: string;
    excerpt?: string;
    cover_image_url?: string;
    audio_url?: string;
    category_id: string;
    series_id?: string;
    chapter_number?: number;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    is_published: boolean;
    is_premium: boolean;
    rejection_reason?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    price: number;
    language: string;
    view_count: number;
    published_at?: string;
    created_at: string;
    updated_at: string;
    
    // Relations
    author?: User;
    category?: Category;
    series?: Series;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    created_at: string;
}

export interface Series {
    id: string;
    author_id: string;
    title: string;
    slug: string;
    description?: string;
    cover_image_url?: string;
    category_id: string;
    total_chapters: number;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
    
    // Relations
    author?: User;
    category?: Category;
    chapters?: Content[];
}

export interface Review {
    id: string;
    content_id: string;
    user_id: string;
    rating: number;
    review_text?: string;
    created_at: string;
    updated_at: string;
    
    // Relations
    user?: User;
    content?: Content;
}

// UI Component Props Types
export interface ContentCardProps {
    title: string;
    excerpt?: string;
    author: string;
    coverImage?: string;
    slug: string;
    category: string;
    isPremium: boolean;
    rating?: number;
    views?: number;
    publishedAt?: string;
    likes?: number;
}

export interface CategoryCardProps {
    name: string;
    slug: string;
    description: string;
    icon: any;
    color: string;
    count: number;
}

// API Response Types
export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Form Types
export interface LoginForm {
    email: string;
    password: string;
}

export interface RegisterForm {
    email: string;
    username: string;
    full_name: string;
    password: string;
}

export interface NewsletterForm {
    email: string;
}

// Quiz Types
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizStatus = 'draft' | 'published' | 'archived';
export type QuizType = 'general' | 'exam';
export type QuizLanguage = 'bn' | 'en' | 'mixed';
export type QuizAttemptStatus = 'entered' | 'in_progress' | 'completed' | 'abandoned';

/** Derived server-side from status + opens_at + closes_at + settled_at. */
export type RoundPhase = 'draft' | 'scheduled' | 'open' | 'closed' | 'settled';

/** Exam sub-categories offered when quiz_type === 'exam'. */
export const EXAM_CATEGORIES = [
    'BCS',
    'Bank Job',
    'Primary',
    'NTRCA',
    'University Admission',
    'Other',
] as const;
export type ExamCategory = (typeof EXAM_CATEGORIES)[number];

export interface QuizSettlementWinner {
    rank: number;
    user_id: string;
    attempt_id: string;
    score: number;
    amount: number;
}

export interface QuizSettlement {
    pool: number;
    rake: number;
    paid: number;
    winners: QuizSettlementWinner[];
    settled_at?: string;
}

export interface QuizSummary {
    id: string;
    title: string;
    description?: string | null;
    difficulty: QuizDifficulty;
    entry_cost: number;
    total_questions: number;
    status: QuizStatus;
    quiz_type: QuizType;
    exam_category?: string | null;
    topic?: string | null;
    opens_at?: string | null;
    closes_at?: string | null;
    prize_pool: number;
    rake_bps: number;
    settled_at?: string | null;
    settlement?: QuizSettlement | null;
    phase: RoundPhase;
    seconds_to_open?: number | null;
    seconds_to_close?: number | null;
    players_joined?: number;
    time_limit_seconds?: number | null;
    published_at?: string | null;
    created_at?: string;
    ai_model?: string | null;
    creator?: Pick<User, 'id' | 'username' | 'full_name' | 'profile_picture_url'>;
    user_attempt?: {
        id: string;
        status: QuizAttemptStatus;
        score: number;
        correct_answers: number;
        kori_earned: number;
    } | null;
}

export interface QuizSpecificLeaderboardEntry {
    rank: number;
    id: string;
    score: number;
    correct_answers: number;
    kori_earned: number;
    duration_ms: number | null;
    completed_at: string | null;
    user: Pick<User, 'id' | 'username' | 'full_name' | 'profile_picture_url'>;
}

export interface QuizQuestionPlayable {
    id: string;
    position: number;
    question_text: string;
    options: string[];
    /** A single round may mix Bangla and English questions. */
    language?: 'bn' | 'en' | null;
}

export interface QuizQuestionFull extends QuizQuestionPlayable {
    correct_index: number;
    explanation?: string | null;
}

export interface QuizReviewItem extends QuizQuestionFull {
    selected_index: number | null;
    is_correct: boolean;
}

export interface QuizAttemptSummary {
    id: string;
    score: number;
    total_questions: number;
    correct_answers: number;
    kori_spent: number;
    kori_earned: number;
    status: QuizAttemptStatus;
    started_at: string;
    completed_at?: string | null;
    duration_ms?: number | null;
    quiz?: {
        id: string;
        title: string;
        difficulty?: QuizDifficulty;
        quiz_type?: QuizType;
        exam_category?: string | null;
        closes_at?: string | null;
        settled_at?: string | null;
    };
}

export interface QuizLeaderboardEntry {
    rank: number;
    user: Pick<User, 'id' | 'username' | 'full_name' | 'profile_picture_url'>;
    totalScore: number;
    totalCorrect: number;
    totalKori: number;
    gamesPlayed: number;
    bestScore: number;
    avgDurationMs: number | null;
}
