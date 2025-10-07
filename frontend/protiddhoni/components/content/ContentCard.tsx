/**
 * Content Card Component
 * Displays content preview in grid/list
 */

import Image from 'next/image';
import Link from 'next/link';

interface ContentCardProps {
    title: string;
    excerpt?: string;
    author: string;
    coverImage?: string;
    slug: string;
    category: string;
    isPremium: boolean;
}

export default function ContentCard({
    title,
    excerpt,
    author,
    coverImage,
    slug,
    category,
    isPremium
}: ContentCardProps) {
    return (
        <Link href={`/read/${slug}`}>
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                {coverImage && (
                    <div className="relative w-full h-48">
                        <Image
                            src={coverImage}
                            alt={title}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-600">{category}</span>
                        {isPremium && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Premium
                            </span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{title}</h3>
                    {excerpt && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{excerpt}</p>
                    )}
                    <p className="text-sm text-gray-500">লিখেছেন: {author}</p>
                </div>
            </div>
        </Link>
    );
}
