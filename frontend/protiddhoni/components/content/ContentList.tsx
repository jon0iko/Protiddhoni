/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
/**
 * Content List Component
 * Lists content with filtering
 */

import ContentCard from './ContentCard';

interface ContentListProps {
    contents: any[];
}

export default function ContentList({ contents }: ContentListProps) {
    if (!contents || contents.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No content found matching your criteria.</p>
            </div>
        );
    }

    // Transform backend data to frontend format if needed
    // Assuming contents are already in a usable format or ContentCard handles it
    const transformContent = (content: any) => ({
        id: content.id,
        title: content.title,
        excerpt: content.excerpt || '',
        author: content.author?.full_name || 'Unknown',
        slug: content.slug,
        category: content.category?.name || '',
        coverImage: content.cover_image_url || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
        isPremium: content.is_premium || false,
        rating: content.stats?.averageRating || content.average_rating || 0,
        views: content.view_count || 0,
        publishedAt: content.published_at ? new Date(content.published_at).toLocaleDateString('bn-BD') : '',
        readTime: '15 min', // Placeholder
        status: 'completed',
        chapters: 1,
        tags: [],
        totalRatings: content.stats?.totalReviews || 0,
        likes: 0
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((content) => (
                <ContentCard 
                    key={content.id} 
                    story={transformContent(content)} 
                />
            ))}
        </div>
    );
}

