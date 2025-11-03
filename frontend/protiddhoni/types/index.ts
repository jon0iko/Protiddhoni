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
