/**
 * Write Page (লিখুন)
 * All users can access this to create content
 */

'use client';

import RichTextEditor from '@/';

export default function WritePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">নতুন লেখা</h1>
            <p className="text-gray-500 mb-4">Write page - To be implemented</p>
            <RichTextEditor content="" onChange={() => {}} />
        </div>
    );
}
