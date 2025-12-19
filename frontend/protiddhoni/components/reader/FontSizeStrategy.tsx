/**
 * Design Pattern: Strategy
 * Font Size Strategy for Reading Interface
 */

export type FontSizeType = 'small' | 'medium' | 'large' | 'xlarge';

export interface FontSizeStrategy {
    applyFontSize(): void;
    getFontSize(): FontSizeType;
}

export class SmallFont implements FontSizeStrategy {
    applyFontSize(): void {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--current-reader-font-size', 'var(--reader-font-small)');
        }
    }

    getFontSize(): FontSizeType {
        return 'small';
    }
}

export class MediumFont implements FontSizeStrategy {
    applyFontSize(): void {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--current-reader-font-size', 'var(--reader-font-medium)');
        }
    }

    getFontSize(): FontSizeType {
        return 'medium';
    }
}

export class LargeFont implements FontSizeStrategy {
    applyFontSize(): void {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--current-reader-font-size', 'var(--reader-font-large)');
        }
    }

    getFontSize(): FontSizeType {
        return 'large';
    }
}

export class XLargeFont implements FontSizeStrategy {
    applyFontSize(): void {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--current-reader-font-size', 'var(--reader-font-xlarge)');
        }
    }

    getFontSize(): FontSizeType {
        return 'xlarge';
    }
}

export class FontSizeContext {
    private strategy: FontSizeStrategy;

    constructor(strategy: FontSizeStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: FontSizeStrategy): void {
        this.strategy = strategy;
        this.applyFontSize();
    }

    applyFontSize(): void {
        this.strategy.applyFontSize();
    }

    getFontSize(): FontSizeType {
        return this.strategy.getFontSize();
    }
}

// Factory function to create font size strategy
export function createFontSizeStrategy(size: FontSizeType): FontSizeStrategy {
    switch (size) {
        case 'small':
            return new SmallFont();
        case 'large':
            return new LargeFont();
        case 'xlarge':
            return new XLargeFont();
        case 'medium':
        default:
            return new MediumFont();
    }
}
