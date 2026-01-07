// Bengali number conversion utility

const bengaliNumbers: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

/**
 * Converts English numbers to Bengali numbers
 * @param num - The number to convert
 * @returns String with Bengali numerals
 */
export function toBengaliNumber(num: number | string): string {
  const numStr = String(num);
  return numStr.replace(/[0-9]/g, (digit) => bengaliNumbers[digit] || digit);
}

/**
 * Extends the Number prototype to support Bengali locale
 * Call this once in your app initialization
 */
export function initializeBengaliNumbers() {
  // Store original toLocaleString
  const originalToLocaleString = Number.prototype.toLocaleString;

  // Override toLocaleString to return Bengali numbers by default
  Number.prototype.toLocaleString = function(
    locales?: string | string[],
    options?: Intl.NumberFormatOptions
  ): string {
    // If Bengali locale is specified or no locale is specified, convert to Bengali
    const shouldUseBengali = !locales || locales === 'bn-BD' || locales === 'bn';
    
    if (shouldUseBengali) {
      // Get formatted string with original method
      const formatted = originalToLocaleString.call(this, locales, options);
      // Convert English digits to Bengali
      return toBengaliNumber(formatted);
    }
    
    // Otherwise use original method
    return originalToLocaleString.call(this, locales, options);
  };
}

// Extend Number interface for TypeScript
declare global {
  interface Number {
    toLocaleString(locales?: string | string[], options?: Intl.NumberFormatOptions): string;
  }
}
