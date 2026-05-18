/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, jsx-a11y/role-has-required-aria-props, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
/**
 * Reading Controls Component
 * Theme toggle, font size controls using Strategy Pattern
 */

'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Type, Minus, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
    ThemeContext, 
    createThemeStrategy, 
    ThemeType 
} from './ThemeStrategy';
import { 
    FontSizeContext, 
    createFontSizeStrategy, 
    FontSizeType 
} from './FontSizeStrategy';

interface ReadingControlsProps {
    onThemeChange?: (theme: ThemeType) => void;
    onFontSizeChange?: (fontSize: FontSizeType) => void;
}

export default function ReadingControls({ onThemeChange, onFontSizeChange }: ReadingControlsProps) {
    const { user, token } = useAuth();
    const [theme, setTheme] = useState<ThemeType>('light');
    const [fontSize, setFontSize] = useState<FontSizeType>('medium');
    const [loading, setLoading] = useState(false);
    const [themeContext] = useState(() => new ThemeContext(createThemeStrategy('light')));
    const [fontSizeContext] = useState(() => new FontSizeContext(createFontSizeStrategy('medium')));

    // Load user preferences on mount
    useEffect(() => {
        if (user && token) {
            loadPreferences();
        } else {
            // Load from localStorage for non-logged in users
            const savedTheme = localStorage.getItem('reader-theme') as ThemeType;
            const savedFontSize = localStorage.getItem('reader-font-size') as FontSizeType;
            
            if (savedTheme) {
                applyTheme(savedTheme);
            }
            if (savedFontSize) {
                applyFontSize(savedFontSize);
            }
        }
    }, [user, token]);

    const loadPreferences = async () => {
        try {
            if (!token) return;
            
            const response = await api.readingPreferences.getPreferences(token);
            if (response.success && response.data) {
                const userTheme = response.data.theme as ThemeType;
                const userFontSize = response.data.font_size as FontSizeType;
                
                applyTheme(userTheme);
                applyFontSize(userFontSize);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    };

    const applyTheme = (newTheme: ThemeType) => {
        setTheme(newTheme);
        themeContext.setStrategy(createThemeStrategy(newTheme));
        themeContext.applyTheme();
        onThemeChange?.(newTheme);
    };

    const applyFontSize = (newSize: FontSizeType) => {
        setFontSize(newSize);
        fontSizeContext.setStrategy(createFontSizeStrategy(newSize));
        fontSizeContext.applyFontSize();
        onFontSizeChange?.(newSize);
    };

    const savePreferences = async (updates: { theme?: ThemeType; font_size?: FontSizeType }) => {
        if (!user || !token) {
            // Save to localStorage for non-logged in users
            if (updates.theme) {
                localStorage.setItem('reader-theme', updates.theme);
            }
            if (updates.font_size) {
                localStorage.setItem('reader-font-size', updates.font_size);
            }
            return;
        }

        setLoading(true);
        try {
            await api.readingPreferences.updatePreferences(updates, token);
        } catch (error) {
            console.error('Error saving preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleThemeChange = (newTheme: ThemeType) => {
        applyTheme(newTheme);
        savePreferences({ theme: newTheme });
    };

    const handleFontSizeChange = (newSize: FontSizeType) => {
        applyFontSize(newSize);
        savePreferences({ font_size: newSize });
    };

    const increaseFontSize = () => {
        const sizes: FontSizeType[] = ['small', 'medium', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(fontSize);
        if (currentIndex < sizes.length - 1) {
            handleFontSizeChange(sizes[currentIndex + 1]);
        }
    };

    const decreaseFontSize = () => {
        const sizes: FontSizeType[] = ['small', 'medium', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(fontSize);
        if (currentIndex > 0) {
            handleFontSizeChange(sizes[currentIndex - 1]);
        }
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Theme Controls */}
            <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
                <span className="text-sm text-gray-600 dark:text-gray-300 mr-2 bengali-text">থিম:</span>
                <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-2 rounded transition-colors ${
                        theme === 'light' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    title="হালকা মোড"
                    disabled={loading}
                >
                    <Sun className="w-5 h-5" />
                </button>
                <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-2 rounded transition-colors ${
                        theme === 'dark' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    title="গাঢ় মোড"
                    disabled={loading}
                >
                    <Moon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => handleThemeChange('sepia')}
                    className={`p-2 rounded transition-colors ${
                        theme === 'sepia' 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    title="সেপিয়া মোড"
                    disabled={loading}
                >
                    <Type className="w-5 h-5" />
                </button>
            </div>

            {/* Font Size Controls */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300 mr-1 bengali-text">ফন্ট:</span>
                <button
                    onClick={decreaseFontSize}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="ছোট করুন"
                    disabled={fontSize === 'small' || loading}
                >
                    <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[50px] text-center">
                    {fontSize === 'small' && 'ছোট'}
                    {fontSize === 'medium' && 'মাঝারি'}
                    {fontSize === 'large' && 'বড়'}
                    {fontSize === 'xlarge' && 'অতিরিক্ত'}
                </span>
                <button
                    onClick={increaseFontSize}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="বড় করুন"
                    disabled={fontSize === 'xlarge' || loading}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
