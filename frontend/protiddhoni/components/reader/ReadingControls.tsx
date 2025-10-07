/**
 * Reading Controls Component
 * Theme toggle, font size, etc.
 */

'use client';

export default function ReadingControls() {
    return (
        <div className="flex gap-2">
            <button className="p-2 border rounded">☀️</button>
            <button className="p-2 border rounded">🌙</button>
            <button className="p-2 border rounded">📄</button>
        </div>
    );
}
