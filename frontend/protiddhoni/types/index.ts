export interface User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    bio?: string;
    profile_picture_url?: string;
    is_admin: boolean;
    created_at: string;
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
    price?: number;
    view_count: number;
    published_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
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
}

export interface Review {
    id: string;
    content_id: string;
    user_id: string;
    rating: number;
    review_text?: string;
    created_at: string;
}
