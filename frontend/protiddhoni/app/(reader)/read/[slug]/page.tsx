/**
 * Read Content Page
 * Dynamic route for reading content
 */

export default function ReadContentPage({ params }: { params: { slug: string } }) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Reading: {params.slug}</h1>
            <p className="text-gray-500">Content reader - To be implemented</p>
        </div>
    );
}
