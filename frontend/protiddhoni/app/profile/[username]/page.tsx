/**
 * User Profile Page
 * Display user's profile and content
 */

export default function ProfilePage({ params }: { params: { username: string } }) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">@{params.username}</h1>
            <p className="text-gray-500">Profile page - To be implemented</p>
        </div>
    );
}
