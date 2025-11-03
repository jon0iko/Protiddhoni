/**
 * Rich Text Editor Component
 * Enhanced placeholder with Bengali support
 */

'use client';

import { useState } from 'react';
import { Bold, Italic, List, Quote, Type, Save, Eye } from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
}

export default function RichTextEditor({ 
    content, 
    onChange, 
    placeholder = "আপনার গল্প বা কবিতা লিখুন...",
    className = ""
}: RichTextEditorProps) {
    const [isPreview, setIsPreview] = useState(false);
    const [wordCount, setWordCount] = useState(0);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        onChange(newContent);
        
        // Calculate word count
        const words = newContent.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
    };

    const formatText = (command: string) => {
        // Placeholder for text formatting - will be implemented with TipTap
        console.log('Format command:', command);
    };

    return (
        <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => formatText('bold')}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                        title="Bold"
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => formatText('italic')}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                        title="Italic"
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    <button
                        type="button"
                        onClick={() => formatText('list')}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                        title="List"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => formatText('quote')}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                        title="Quote"
                    >
                        <Quote className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    <button
                        type="button"
                        onClick={() => formatText('heading')}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                        title="Heading"
                    >
                        <Type className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 bengali-text">
                        {wordCount} শব্দ
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsPreview(!isPreview)}
                        className={`p-2 rounded transition-colors ${
                            isPreview 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                        title={isPreview ? 'Edit' : 'Preview'}
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Editor/Preview Area */}
            <div className="relative">
                {isPreview ? (
                    <div className="p-6 min-h-96 prose max-w-none bengali-text">
                        {content ? (
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {content}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">
                                প্রিভিউ দেখার জন্য কিছু লিখুন...
                            </p>
                        )}
                    </div>
                ) : (
                    <textarea
                        value={content}
                        onChange={handleContentChange}
                        placeholder={placeholder}
                        className="w-full p-6 min-h-96 resize-none focus:outline-none bengali-text text-base leading-relaxed"
                        style={{
                            fontFamily: 'var(--font-kalpurush), serif',
                            lineHeight: '1.8'
                        }}
                    />
                )}
            </div>

            {/* Status Bar */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-2 flex items-center justify-between text-sm text-gray-500">
                <div className="bengali-text">
                    {content.length === 0 ? 'লেখা শুরু করুন...' : 'লিখছেন...'}
                </div>
                <div className="flex items-center space-x-4">
                    <span>{content.length} অক্ষর</span>
                    <span className="bengali-text">বাংলা ফন্ট সক্রিয়</span>
                </div>
            </div>

            {/* Writing Tips */}
            {content.length === 0 && (
                <div className="bg-blue-50 border-t border-blue-200 p-4">
                    <h4 className="font-medium text-blue-900 mb-2 bengali-text">লেখার টিপস:</h4>
                    <ul className="text-sm text-blue-800 space-y-1 bengali-text">
                        <li>• একটি আকর্ষণীয় শুরু দিয়ে পাঠকদের মনোযোগ আকর্ষণ করুন</li>
                        <li>• সহজ ও প্রাঞ্জল ভাষা ব্যবহার করুন</li>
                        <li>• প্যারাগ্রাফ ভাগ করে লিখুন যাতে পড়তে সুবিধা হY়</li>
                        <li>• বানান ও ব্যাকরণের দিকে খেয়াল রাখুন</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
