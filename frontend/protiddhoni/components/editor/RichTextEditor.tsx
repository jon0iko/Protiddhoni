/**
 * Rich Text Editor Component
 * TODO: Implement using TipTap
 */

'use client';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    return (
        <div className="border rounded-lg p-4">
            <p className="text-gray-500">Rich Text Editor - To be implemented</p>
        </div>
    );
}
