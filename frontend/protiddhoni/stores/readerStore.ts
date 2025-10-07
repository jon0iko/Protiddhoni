import { create } from 'zustand';

interface ReaderState {
    theme: 'light' | 'dark' | 'sepia';
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    setTheme: (theme: 'light' | 'dark' | 'sepia') => void;
    setFontSize: (size: 'small' | 'medium' | 'large' | 'xlarge') => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
    theme: 'light',
    fontSize: 'medium',
    setTheme: (theme) => set({ theme }),
    setFontSize: (fontSize) => set({ fontSize }),
}));
