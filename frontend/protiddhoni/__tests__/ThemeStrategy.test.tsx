/**
 * Unit Tests for ThemeStrategy (Strategy Pattern - Frontend)
 * Tests different reading theme implementations
 */

import { 
    ThemeContext, 
    LightTheme, 
    DarkTheme, 
    SepiaTheme,
    createThemeStrategy
} from '../components/reader/ThemeStrategy';

describe('ThemeStrategy - Strategy Pattern (Frontend)', () => {
    
    // Mock document for testing
    beforeAll(() => {
        if (typeof document === 'undefined') {
            (global as any).document = {
                documentElement: {
                    setAttribute: jest.fn(),
                    getAttribute: jest.fn(),
                }
            };
        }
    });

    describe('LightTheme Strategy', () => {
        test('should apply light theme by setting data attribute', () => {
            const lightTheme = new LightTheme();
            const mockSetAttribute = jest.fn();
            
            // Mock document.documentElement.setAttribute
            const originalSetAttribute = document.documentElement.setAttribute;
            document.documentElement.setAttribute = mockSetAttribute;
            
            lightTheme.applyTheme();
            
            expect(mockSetAttribute).toHaveBeenCalledWith('data-reader-theme', 'light');
            
            // Restore
            document.documentElement.setAttribute = originalSetAttribute;
        });

        test('should return correct theme type', () => {
            const lightTheme = new LightTheme();
            expect(lightTheme.getThemeType()).toBe('light');
        });
    });

    describe('DarkTheme Strategy', () => {
        test('should apply dark theme by setting data attribute', () => {
            const darkTheme = new DarkTheme();
            const mockSetAttribute = jest.fn();
            
            const originalSetAttribute = document.documentElement.setAttribute;
            document.documentElement.setAttribute = mockSetAttribute;
            
            darkTheme.applyTheme();
            
            expect(mockSetAttribute).toHaveBeenCalledWith('data-reader-theme', 'dark');
            
            document.documentElement.setAttribute = originalSetAttribute;
        });

        test('should return correct theme type', () => {
            const darkTheme = new DarkTheme();
            expect(darkTheme.getThemeType()).toBe('dark');
        });
    });

    describe('SepiaTheme Strategy', () => {
        test('should apply sepia theme by setting data attribute', () => {
            const sepiaTheme = new SepiaTheme();
            const mockSetAttribute = jest.fn();
            
            const originalSetAttribute = document.documentElement.setAttribute;
            document.documentElement.setAttribute = mockSetAttribute;
            
            sepiaTheme.applyTheme();
            
            expect(mockSetAttribute).toHaveBeenCalledWith('data-reader-theme', 'sepia');
            
            document.documentElement.setAttribute = originalSetAttribute;
        });

        test('should return correct theme type', () => {
            const sepiaTheme = new SepiaTheme();
            expect(sepiaTheme.getThemeType()).toBe('sepia');
        });
    });
        });
    });

    describe('DarkTheme Strategy', () => {
        test('should apply dark theme styles', () => {
            const darkTheme = new DarkTheme();
            const styles = darkTheme.applyTheme();

            expect(styles).toBeDefined();
            expect(styles.backgroundColor).toBe('#1a1a1a');
            expect(styles.color).toBe('#e0e0e0');
        });

        test('should provide dark background for night reading', () => {
            const darkTheme = new DarkTheme();
            const styles = darkTheme.applyTheme();

            // Dark theme should have dark background
            const bgColor = styles.backgroundColor;
            expect(bgColor).toMatch(/#1a1a1a|#000|black/i);
        });

        test('should have light text on dark background', () => {
            const darkTheme = new DarkTheme();
            const styles = darkTheme.applyTheme();

            // Text should be light colored
            expect(styles.color).toMatch(/#e0e0e0|#fff|white|#[cdef]/i);
        });
    });

    describe('SepiaTheme Strategy', () => {
        test('should apply sepia theme styles', () => {
            const sepiaTheme = new SepiaTheme();
            const styles = sepiaTheme.applyTheme();

            expect(styles).toBeDefined();
            expect(styles.backgroundColor).toBe('#f4ecd8');
            expect(styles.color).toBe('#5c4a2c');
        });

        test('should provide warm sepia tone', () => {
            const sepiaTheme = new SepiaTheme();
            const styles = sepiaTheme.applyTheme();

            // Sepia should have warm, paper-like background
            expect(styles.backgroundColor).toMatch(/#f4ecd8/i);
        });

        test('should have brown text for classic book feel', () => {
            const sepiaTheme = new SepiaTheme();
            const styles = sepiaTheme.applyTheme();

            // Text should be brownish
            expect(styles.color).toMatch(/#5c4a2c|brown/i);
        });
    });

    describe('ThemeContext', () => {
        test('should initialize with a theme strategy', () => {
            const lightTheme = new LightTheme();
            const context = new ThemeContext(lightTheme);

            expect(context).toBeDefined();
            expect(typeof context.applyTheme).toBe('function');
            expect(typeof context.getThemeType).toBe('function');
        });

        test('should return current theme type', () => {
            const lightTheme = new LightTheme();
            const context = new ThemeContext(lightTheme);
            
            expect(context.getThemeType()).toBe('light');
        });

        test('should allow changing theme strategy at runtime', () => {
            const lightTheme = new LightTheme();
            const darkTheme = new DarkTheme();
            const context = new ThemeContext(lightTheme);
            const mockSetAttribute = jest.fn();
            
            const originalSetAttribute = document.documentElement.setAttribute;
            document.documentElement.setAttribute = mockSetAttribute;

            // Initially light
            expect(context.getThemeType()).toBe('light');

            // Switch to dark
            context.setStrategy(darkTheme);
            expect(context.getThemeType()).toBe('dark');
            expect(mockSetAttribute).toHaveBeenCalledWith('data-reader-theme', 'dark');
            
            document.documentElement.setAttribute = originalSetAttribute;
        });

        test('should switch between all theme types', () => {
            const context = new ThemeContext(new LightTheme());

            // Light
            expect(context.getThemeType()).toBe('light');

            // Dark
            context.setStrategy(new DarkTheme());
            expect(context.getThemeType()).toBe('dark');

            // Sepia
            context.setStrategy(new SepiaTheme());
            expect(context.getThemeType()).toBe('sepia');
        });
    });

    describe('createThemeStrategy Factory', () => {
        test('should create LightTheme for "light" parameter', () => {
            const theme = createThemeStrategy('light');
            expect(theme).toBeInstanceOf(LightTheme);
            expect(theme.getThemeType()).toBe('light');
        });

        test('should create DarkTheme for "dark" parameter', () => {
            const theme = createThemeStrategy('dark');
            expect(theme).toBeInstanceOf(DarkTheme);
            expect(theme.getThemeType()).toBe('dark');
        });

        test('should create SepiaTheme for "sepia" parameter', () => {
            const theme = createThemeStrategy('sepia');
            expect(theme).toBeInstanceOf(SepiaTheme);
            expect(theme.getThemeType()).toBe('sepia');
        });

        test('should default to LightTheme for invalid parameter', () => {
            const theme = createThemeStrategy('invalid' as any);
            expect(theme).toBeInstanceOf(LightTheme);
            expect(theme.getThemeType()).toBe('light');
        });
    });

    describe('Strategy Pattern Implementation', () => {
        test('all themes should implement same interface', () => {
            const lightTheme = new LightTheme();
            const darkTheme = new DarkTheme();
            const sepiaTheme = new SepiaTheme();

            // All should have applyTheme method
            expect(typeof lightTheme.applyTheme).toBe('function');
            expect(typeof darkTheme.applyTheme).toBe('function');
            expect(typeof sepiaTheme.applyTheme).toBe('function');

            // All should have getThemeType method
            expect(typeof lightTheme.getThemeType).toBe('function');
            expect(typeof darkTheme.getThemeType).toBe('function');
            expect(typeof sepiaTheme.getThemeType).toBe('function');
        });

        test('context should decouple client from concrete strategies', () => {
            const context = new ThemeContext(new LightTheme());

            // Client doesn't need to know which theme is active
            const themeType = context.getThemeType();
            expect(themeType).toBeDefined();
            expect(['light', 'dark', 'sepia']).toContain(themeType);
        });

        test('should demonstrate Open/Closed Principle', () => {
            // New themes can be added without modifying existing code
            class CustomTheme {
                applyTheme() {
                    if (typeof document !== 'undefined') {
                        document.documentElement.setAttribute('data-reader-theme', 'custom');
                    }
                }
                getThemeType() {
                    return 'custom' as any;
                }
            }

            const customTheme = new CustomTheme();
            const context = new ThemeContext(customTheme as any);
            
            expect(context.getThemeType()).toBe('custom');
        });
    });

    describe('User Experience Scenarios', () => {
        test('should support day reading with light theme', () => {
            const context = new ThemeContext(new LightTheme());
            
            expect(context.getThemeType()).toBe('light');
            // Light theme is best for daytime reading
        });

        test('should support night reading with dark theme', () => {
            const context = new ThemeContext(new DarkTheme());
            
            expect(context.getThemeType()).toBe('dark');
            // Dark theme reduces eye strain at night
        });

        test('should support comfortable reading with sepia theme', () => {
            const context = new ThemeContext(new SepiaTheme());
            const styles = context.getTheme();

            expect(styles.backgroundColor).toBe('#f4ecd8');
            // Sepia reduces eye strain
        });

        test('should maintain user preference across theme switches', () => {
            const context = new ThemeContext(new LightTheme());
            
            // User can switch themes multiple times
            context.setStrategy(new DarkTheme());
            expect(context.getThemeType()).toBe('dark');
            
            context.setStrategy(new SepiaTheme());
            expect(context.getThemeType()).toBe('sepia');
            
            context.setStrategy(new LightTheme());
            expect(context.getThemeType()).toBe('light');
        });
    });

    describe('Theme Consistency', () => {
        test('each theme should provide distinct visual experience', () => {
            const light = new LightTheme();
            const dark = new DarkTheme();
            const sepia = new SepiaTheme();

            // All theme types should be different
            expect(light.getThemeType()).not.toBe(dark.getThemeType());
            expect(dark.getThemeType()).not.toBe(sepia.getThemeType());
            expect(sepia.getThemeType()).not.toBe(light.getThemeType());
        });

        test('themes should apply consistently', () => {
            const themes = [
                new LightTheme(),
                new DarkTheme(),
                new SepiaTheme()
            ];

            const mockSetAttribute = jest.fn();
            const originalSetAttribute = document.documentElement.setAttribute;
            document.documentElement.setAttribute = mockSetAttribute;

            themes.forEach(theme => {
                mockSetAttribute.mockClear();
                theme.applyTheme();
                
                // Should call setAttribute once
                expect(mockSetAttribute).toHaveBeenCalledTimes(1);
                expect(mockSetAttribute).toHaveBeenCalledWith('data-reader-theme', theme.getThemeType());
            });

            document.documentElement.setAttribute = originalSetAttribute;
        });
    });

    describe('React Integration', () => {
        test('should work seamlessly with React components', () => {
            const lightTheme = new LightTheme();
            
            // Should be usable in React
            expect(typeof lightTheme.applyTheme).toBe('function');
            expect(lightTheme.getThemeType()).toBe('light');
        });

        test('context should work with React state management', () => {
            let currentTheme = 'light';
            const context = new ThemeContext(createThemeStrategy(currentTheme as any));

            expect(context.getThemeType()).toBe('light');

            // Simulating state change to dark
            currentTheme = 'dark';
            context.setStrategy(createThemeStrategy(currentTheme as any));
            
            expect(context.getThemeType()).toBe('dark');
        });
    });

    describe('Pattern Benefits Demonstration', () => {
        test('should eliminate conditional logic for theme selection', () => {
            // Without Strategy: messy if-else chains
            // With Strategy: clean interface using factory
            
            const themes = ['light', 'dark', 'sepia'];

            themes.forEach(themeName => {
                const theme = createThemeStrategy(themeName as any);
                const context = new ThemeContext(theme);
                expect(context.getThemeType()).toBe(themeName);
            });
        });

        test('should make it easy to add new themes', () => {
            // New theme can be added without modifying existing code
            class HighContrastTheme {
                applyTheme() {
                    if (typeof document !== 'undefined') {
                        document.documentElement.setAttribute('data-reader-theme', 'high-contrast');
                    }
                }
                getThemeType() {
                    return 'high-contrast' as any;
                }
            }

            const context = new ThemeContext(new HighContrastTheme() as any);
            
            expect(context.getThemeType()).toBe('high-contrast');
        });

        test('should support user preferences persistence', () => {
            // Could be stored in localStorage or database
            const userPreference = 'dark';
            
            const selectedTheme = createThemeStrategy(userPreference as any);
            const context = new ThemeContext(selectedTheme);
            
            expect(context.getThemeType()).toBe('dark');
        });
    });
});
