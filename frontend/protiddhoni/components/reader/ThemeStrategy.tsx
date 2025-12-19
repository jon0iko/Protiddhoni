/**
 * Design Pattern: Strategy
 * Theme Strategy for Reading Interface
 */

export type ThemeType = 'light' | 'dark' | 'sepia';

export interface ThemeStrategy {
    applyTheme(): void;
    getThemeType(): ThemeType;
}

export class LightTheme implements ThemeStrategy {
    applyTheme(): void {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-reader-theme', 'light');
        }
    }

    getThemeType(): ThemeType {
        return 'light';
    }
}

export class DarkTheme implements ThemeStrategy {
    applyTheme(): void {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-reader-theme', 'dark');
        }
    }

    getThemeType(): ThemeType {
        return 'dark';
    }
}

export class SepiaTheme implements ThemeStrategy {
    applyTheme(): void {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-reader-theme', 'sepia');
        }
    }

    getThemeType(): ThemeType {
        return 'sepia';
    }
}

export class ThemeContext {
    private strategy: ThemeStrategy;

    constructor(strategy: ThemeStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: ThemeStrategy): void {
        this.strategy = strategy;
        this.applyTheme();
    }

    applyTheme(): void {
        this.strategy.applyTheme();
    }

    getThemeType(): ThemeType {
        return this.strategy.getThemeType();
    }
}

// Factory function to create theme strategy
export function createThemeStrategy(theme: ThemeType): ThemeStrategy {
    switch (theme) {
        case 'dark':
            return new DarkTheme();
        case 'sepia':
            return new SepiaTheme();
        case 'light':
        default:
            return new LightTheme();
    }
}
