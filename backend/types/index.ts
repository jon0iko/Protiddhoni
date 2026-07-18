/**
 * Shared domain types for the Protiddhoni backend.
 *
 * These mirror the Supabase table shapes. Fields are optional where the API
 * selects a subset of columns (e.g. an author joined onto content), so the same
 * interface can describe both a full row and a projection.
 */

/** The JWT payload attached to a request by the auth middleware. */
export interface AuthUser {
    id: string;
    email?: string;
    username?: string;
    full_name?: string;
    is_admin?: boolean;
    [key: string]: any;
}

export interface User {
    id: string;
    email?: string;
    username?: string;
    full_name?: string;
    bio?: string;
    profile_picture_url?: string;
    is_admin?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}

export type ContentStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface Content {
    id: string;
    title?: string;
    slug?: string;
    excerpt?: string;
    body?: string;
    content_type?: string;
    status?: ContentStatus;
    is_published?: boolean;
    is_premium?: boolean;
    price?: number;
    view_count?: number;
    author_id?: string;
    category_id?: string;
    series_id?: string | null;
    published_at?: string;
    created_at?: string;
    updated_at?: string;
    rejection_reason?: string | null;
    reviewed_by?: string;
    reviewed_at?: string;
    /** Joined relations, present depending on the select() used. */
    author?: User & { isFollowing?: boolean };
    category?: Category;
    series?: Series;
    stats?: ContentStats;
    average_rating?: number;
    [key: string]: any;
}

export interface ContentStats {
    totalReviews: number;
    averageRating: number;
}

export interface Category {
    id: string;
    name?: string;
    slug?: string;
    description?: string | null;
    icon?: string | null;
    contentCount?: number;
    [key: string]: any;
}

export interface Series {
    id: string;
    title?: string;
    slug?: string;
    total_chapters?: number;
    is_completed?: boolean;
    author_id?: string;
    [key: string]: any;
}

export interface Review {
    id: string;
    content_id?: string;
    user_id?: string;
    rating?: number;
    comment?: string;
    [key: string]: any;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: Pagination;
}

/** Result of a paywall / access-control check. */
export interface AccessResult {
    granted: boolean;
    reason?: string;
    message?: string;
    requiresPayment?: boolean;
    contentDetails?: {
        id: string;
        title?: string;
        price: number;
    };
}

/*
 * Augment Express's Request so `req.user` is available and typed on every
 * handler without needing a custom Request type at each call site.
 */
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
