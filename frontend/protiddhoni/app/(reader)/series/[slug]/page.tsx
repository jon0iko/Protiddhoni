/**
 * Series Page
 * View series with all chapters
 */

export default function SeriesPage({ params }: { params: { slug: string } }) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Series: {params.slug}</h1>
            <p className="text-gray-500">Series page - To be implemented</p>
        </div>
    );
}
