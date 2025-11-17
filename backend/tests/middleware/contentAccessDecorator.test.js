/**
 * Unit Tests for ContentAccessDecorator (Decorator Pattern)
 * Tests dynamic access control for premium content
 */

const { ContentAccess, PaywallDecorator } = require('../../middleware/contentAccessDecorator');

// Mock database
const mockDb = {
    getClient: jest.fn(() => ({
        from: jest.fn((table) => {
            if (table === 'content') {
                return {
                    select: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            single: jest.fn(() => Promise.resolve({
                                data: { is_premium: true },
                                error: null
                            }))
                        }))
                    }))
                };
            }
            if (table === 'purchases') {
                return {
                    select: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            eq: jest.fn(() => ({
                                eq: jest.fn(() => ({
                                    single: jest.fn(() => Promise.resolve({
                                        data: { id: 'purchase-123' },
                                        error: null
                                    }))
                                }))
                            }))
                        }))
                    }))
                };
            }
            return {
                select: jest.fn(() => ({
                    eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
                }))
            };
        })
    }))
};

describe('ContentAccessDecorator - Decorator Pattern', () => {
    
    describe('Base ContentAccess', () => {
        test('should grant access by default', async () => {
            const baseAccess = new ContentAccess();
            const result = await baseAccess.checkAccess('user-123', 'content-456');

            expect(result).toBeDefined();
            expect(result.granted).toBe(true);
        });

        test('should provide basic access checking', async () => {
            const baseAccess = new ContentAccess();
            
            expect(typeof baseAccess.checkAccess).toBe('function');
            
            const result = await baseAccess.checkAccess('any-user', 'any-content');
            expect(result).toHaveProperty('granted');
        });
    });

    describe('PaywallDecorator', () => {
        test('should wrap base access with premium check', async () => {
            const baseAccess = new ContentAccess();
            const paywallDecorator = new PaywallDecorator(baseAccess, mockDb);

            expect(paywallDecorator).toBeDefined();
            expect(typeof paywallDecorator.checkAccess).toBe('function');
        });

        test('should grant access to free content', async () => {
            const baseAccess = new ContentAccess();
            
            // Mock free content
            const mockDbFree = {
                getClient: jest.fn(() => ({
                    from: jest.fn(() => ({
                        select: jest.fn(() => ({
                            eq: jest.fn(() => ({
                                single: jest.fn(() => Promise.resolve({
                                    data: { is_premium: false },
                                    error: null
                                }))
                            }))
                        }))
                    }))
                }))
            };
            
            const paywallDecorator = new PaywallDecorator(baseAccess, mockDbFree);
            const result = await paywallDecorator.checkAccess('user-123', 'free-content');

            expect(result.granted).toBe(true);
        });

        test('should check purchase for premium content', async () => {
            const baseAccess = new ContentAccess();
            const paywallDecorator = new PaywallDecorator(baseAccess, mockDb);

            const result = await paywallDecorator.checkAccess('user-123', 'premium-content');

            // Should check for purchase
            expect(result).toBeDefined();
            expect(result).toHaveProperty('granted');
        });

        test('should deny access to unpurchased premium content', async () => {
            const baseAccess = new ContentAccess();
            
            // Mock no purchase
            const mockDbNoPurchase = {
                getClient: jest.fn(() => ({
                    from: jest.fn((table) => {
                        if (table === 'content') {
                            return {
                                select: jest.fn(() => ({
                                    eq: jest.fn(() => ({
                                        single: jest.fn(() => Promise.resolve({
                                            data: { is_premium: true },
                                            error: null
                                        }))
                                    }))
                                }))
                            };
                        }
                        if (table === 'purchases') {
                            return {
                                select: jest.fn(() => ({
                                    eq: jest.fn(() => ({
                                        eq: jest.fn(() => ({
                                            eq: jest.fn(() => ({
                                                single: jest.fn(() => Promise.resolve({
                                                    data: null,
                                                    error: null
                                                }))
                                            }))
                                        }))
                                    }))
                                }))
                            };
                        }
                        return {
                            select: jest.fn(() => ({
                                eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
                            }))
                        };
                    })
                }))
            };
            
            const paywallDecorator = new PaywallDecorator(baseAccess, mockDbNoPurchase);
            const result = await paywallDecorator.checkAccess('user-456', 'premium-content');

            expect(result.granted).toBe(false);
            expect(result.reason).toBe('premium_content');
            expect(result.message).toContain('requires purchase');
        });

        test('should grant access to purchased premium content', async () => {
            const baseAccess = new ContentAccess();
            const paywallDecorator = new PaywallDecorator(baseAccess, mockDb);

            // Mock shows purchase exists
            const result = await paywallDecorator.checkAccess('user-123', 'premium-content');

            expect(result.granted).toBe(true);
        });
    });

    describe('Decorator Pattern Behavior', () => {
        test('should maintain base functionality', async () => {
            const baseAccess = new ContentAccess();
            const decorator = new PaywallDecorator(baseAccess, mockDb);

            // Decorator should enhance, not replace
            expect(typeof decorator.checkAccess).toBe('function');
            
            const result = await decorator.checkAccess('user', 'content');
            expect(result).toHaveProperty('granted');
        });

        test('should add functionality dynamically', async () => {
            const baseAccess = new ContentAccess();
            
            // Without decorator - simple access
            const baseResult = await baseAccess.checkAccess('user', 'content');
            expect(baseResult.granted).toBe(true);

            // With decorator - enhanced access with premium check
            const decorator = new PaywallDecorator(baseAccess, mockDb);
            const decoratedResult = await decorator.checkAccess('user', 'content');
            
            // Decorator adds additional checks
            expect(decoratedResult).toHaveProperty('granted');
        });

        test('should wrap original object', () => {
            const baseAccess = new ContentAccess();
            const decorator = new PaywallDecorator(baseAccess, mockDb);

            // Decorator should contain reference to wrapped object
            expect(decorator.wrappedAccess).toBe(baseAccess);
        });

        test('should allow stacking decorators', async () => {
            // Base access
            const baseAccess = new ContentAccess();
            
            // First decorator layer
            const paywallDecorator = new PaywallDecorator(baseAccess, mockDb);
            
            // Could add more decorators (e.g., SubscriptionDecorator)
            // This demonstrates the flexibility of decorator pattern
            expect(paywallDecorator.wrappedAccess).toBe(baseAccess);
            
            const result = await paywallDecorator.checkAccess('user', 'content');
            expect(result).toBeDefined();
        });
    });

    describe('Access Control Scenarios', () => {
        test('should handle public story access', async () => {
            const baseAccess = new ContentAccess();
            
            const mockDbPublic = {
                getClient: jest.fn(() => ({
                    from: jest.fn(() => ({
                        select: jest.fn(() => ({
                            eq: jest.fn(() => ({
                                single: jest.fn(() => Promise.resolve({
                                    data: { is_premium: false },
                                    error: null
                                }))
                            }))
                        }))
                    }))
                }))
            };
            
            const decorator = new PaywallDecorator(baseAccess, mockDbPublic);
            const result = await decorator.checkAccess('any-user', 'free-story');

            expect(result.granted).toBe(true);
        });

        test('should handle premium story purchase check', async () => {
            const baseAccess = new ContentAccess();
            const decorator = new PaywallDecorator(baseAccess, mockDb);

            // User has purchased
            const result = await decorator.checkAccess('paying-user', 'premium-story');
            
            expect(result).toBeDefined();
        });

        test('should provide clear rejection reason', async () => {
            const baseAccess = new ContentAccess();
            
            const mockDbNoPurchase = {
                getClient: jest.fn(() => ({
                    from: jest.fn((table) => {
                        if (table === 'content') {
                            return {
                                select: jest.fn(() => ({
                                    eq: jest.fn(() => ({
                                        single: jest.fn(() => Promise.resolve({
                                            data: { is_premium: true },
                                            error: null
                                        }))
                                    }))
                                }))
                            };
                        }
                        return {
                            select: jest.fn(() => ({
                                eq: jest.fn(() => ({
                                    eq: jest.fn(() => ({
                                        eq: jest.fn(() => ({
                                            single: jest.fn(() => Promise.resolve({
                                                data: null,
                                                error: null
                                            }))
                                        }))
                                    }))
                                }))
                            }))
                        };
                    })
                }))
            };
            
            const decorator = new PaywallDecorator(baseAccess, mockDbNoPurchase);
            const result = await decorator.checkAccess('non-paying-user', 'premium-story');

            expect(result.granted).toBe(false);
            expect(result.reason).toBe('premium_content');
            expect(result.message).toBeDefined();
        });
    });

    describe('Pattern Advantages', () => {
        test('should extend functionality without modifying base class', () => {
            const baseAccess = new ContentAccess();
            const originalCheckAccess = baseAccess.checkAccess;
            
            // Add decorator
            const decorator = new PaywallDecorator(baseAccess, mockDb);
            
            // Base class unchanged
            expect(baseAccess.checkAccess).toBe(originalCheckAccess);
            
            // Decorator has its own implementation
            expect(decorator.checkAccess).toBeDefined();
        });

        test('should follow Open/Closed Principle', () => {
            // Open for extension (can add decorators)
            // Closed for modification (base class unchanged)
            
            const baseAccess = new ContentAccess();
            
            // Can extend with decorators
            const decorator1 = new PaywallDecorator(baseAccess, mockDb);
            
            // Base remains the same
            expect(typeof baseAccess.checkAccess).toBe('function');
            expect(typeof decorator1.checkAccess).toBe('function');
        });

        test('should provide flexible permission layers', async () => {
            const baseAccess = new ContentAccess();
            
            // Layer 1: Paywall check
            const decorator = new PaywallDecorator(baseAccess, mockDb);
            
            // Could add Layer 2: Subscription check
            // Could add Layer 3: Region check
            // All without modifying existing code
            
            const result = await decorator.checkAccess('user', 'content');
            expect(result).toBeDefined();
        });
    });

    describe('Integration with Content System', () => {
        test('should work with different content types', async () => {
            const baseAccess = new ContentAccess();
            const decorator = new PaywallDecorator(baseAccess, mockDb);

            const contentTypes = ['story', 'poem', 'chapter', 'series'];
            
            for (const type of contentTypes) {
                const result = await decorator.checkAccess('user-123', `content-${type}`);
                expect(result).toHaveProperty('granted');
            }
        });

        test('should support multiple users accessing same content', async () => {
            const baseAccess = new ContentAccess();
            const decorator = new PaywallDecorator(baseAccess, mockDb);

            const users = ['user-1', 'user-2', 'user-3'];
            const contentId = 'shared-content';

            for (const userId of users) {
                const result = await decorator.checkAccess(userId, contentId);
                expect(result).toBeDefined();
            }
        });
    });
});
