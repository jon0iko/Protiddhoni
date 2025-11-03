/**
 * Design Pattern: Strategy
 */

import { CSSProperties } from 'react';

export interface ThemeStrategy {
    applyTheme(): CSSProperties;
}

export class LightTheme implements ThemeStrategy {
    applyTheme(): CSSProperties {
        return {
            backgroundColor: '#ffffff',
            color: '#000000',
        };
    }
}

export class DarkTheme implements ThemeStrategy {
    applyTheme(): CSSProperties {
        return {
            backgroundColor: '#1a1a1a',
            color: '#e0e0e0',
        };
    }
}

export class SepiaTheme implements ThemeStrategy {
    applyTheme(): CSSProperties {
        return {
            backgroundColor: '#f4ecd8',
            color: '#5c4a2c',
        };
    }
}

export class ThemeContext {
    private strategy: ThemeStrategy;

    constructor(strategy: ThemeStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: ThemeStrategy) {
        this.strategy = strategy;
    }

    getTheme(): CSSProperties {
        return this.strategy.applyTheme();
    }
}
