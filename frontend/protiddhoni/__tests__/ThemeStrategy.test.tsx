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

    // NOTE: two describe blocks were removed here -- 'Strategy Pattern
    // Implementation' and 'Pattern Benefits Demonstration'. They asserted things
    // like `expect(typeof theme.applyTheme).toBe('function')` and re-checked
    // getThemeType() through a locally-declared throwaway class. They added no
    // coverage (this file was already at 100% from the tests above) and could not
    // fail for any change that a compiler would not already reject -- they only
    // inflated the test count.

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

            expect(context.getThemeType()).toBe('sepia');
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

});
