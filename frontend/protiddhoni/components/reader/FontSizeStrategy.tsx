/**
 * Design Pattern: Strategy
 */

export interface FontSizeStrategy {
    applyFontSize(): string;
}

export class SmallFont implements FontSizeStrategy {
    applyFontSize(): string {
        return '14px';
    }
}

export class MediumFont implements FontSizeStrategy {
    applyFontSize(): string {
        return '16px';
    }
}

export class LargeFont implements FontSizeStrategy {
    applyFontSize(): string {
        return '18px';
    }
}

export class XLargeFont implements FontSizeStrategy {
    applyFontSize(): string {
        return '20px';
    }
}
