/**
 * Unit Tests for PaymentStrategy (Strategy Pattern)
 * Tests different payment processing strategies
 */

import { PaymentContext, SSLCommerzPayment, BkashPayment } from '../../services/paymentStrategy';

describe('PaymentStrategy - Strategy Pattern', () => {
    
    let paymentContext;

    beforeEach(() => {
        paymentContext = new PaymentContext();
    });

    describe('SSLCommerz Payment Strategy', () => {
        test('should process payment through SSLCommerz', async () => {
            const sslCommerzStrategy = new SSLCommerzPayment();
            paymentContext.setStrategy(sslCommerzStrategy);

            const amount = 150.00;
            const paymentData = {
                user_id: 'user-123',
                content_id: 'content-456',
                currency: 'BDT'
            };

            const result = await paymentContext.executePayment(amount, paymentData);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.method).toBe('sslcommerz');
            expect(result.transactionId).toContain('SSL_');
        });

        test('should return transaction ID for SSLCommerz', async () => {
            const sslCommerzStrategy = new SSLCommerzPayment();
            const result = await sslCommerzStrategy.processPayment(200, {});

            expect(result.transactionId).toBeDefined();
            expect(typeof result.transactionId).toBe('string');
        });

        test('should handle different amounts for SSLCommerz', async () => {
            const sslCommerzStrategy = new SSLCommerzPayment();
            paymentContext.setStrategy(sslCommerzStrategy);

            const amounts = [50, 100, 500, 1000];

            for (const amount of amounts) {
                const result = await paymentContext.executePayment(amount, {});
                expect(result.success).toBe(true);
            }
        });
    });

    describe('bKash Payment Strategy', () => {
        test('should process payment through bKash', async () => {
            const bkashStrategy = new BkashPayment();
            paymentContext.setStrategy(bkashStrategy);

            const amount = 250.00;
            const paymentData = {
                user_id: 'user-789',
                content_id: 'content-101',
                phone_number: '01712345678'
            };

            const result = await paymentContext.executePayment(amount, paymentData);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.method).toBe('bkash');
            expect(result.transactionId).toContain('BKASH_');
        });

        test('should return transaction ID for bKash', async () => {
            const bkashStrategy = new BkashPayment();
            const result = await bkashStrategy.processPayment(300, {});

            expect(result.transactionId).toBeDefined();
            expect(typeof result.transactionId).toBe('string');
        });

        test('should handle mobile wallet payments', async () => {
            const bkashStrategy = new BkashPayment();
            paymentContext.setStrategy(bkashStrategy);

            const paymentData = {
                phone_number: '01812345678',
                user_id: 'user-mobile'
            };

            const result = await paymentContext.executePayment(100, paymentData);
            expect(result.success).toBe(true);
        });
    });

    describe('Strategy Pattern Implementation', () => {
        test('should allow runtime strategy switching', async () => {
            const amount = 100;
            const data = { user_id: 'user-123' };

            // First use SSLCommerz
            paymentContext.setStrategy(new SSLCommerzPayment());
            const sslResult = await paymentContext.executePayment(amount, data);
            expect(sslResult.method).toBe('sslcommerz');

            // Switch to bKash
            paymentContext.setStrategy(new BkashPayment());
            const bkashResult = await paymentContext.executePayment(amount, data);
            expect(bkashResult.method).toBe('bkash');
        });

        test('should throw error if no strategy is set', async () => {
            const context = new PaymentContext();

            await expect(
                context.executePayment(100, {})
            ).rejects.toThrow('Payment strategy not set');
        });

        test('should use same interface for different strategies', async () => {
            const sslStrategy = new SSLCommerzPayment();
            const bkashStrategy = new BkashPayment();

            // Both should have processPayment method
            expect(typeof sslStrategy.processPayment).toBe('function');
            expect(typeof bkashStrategy.processPayment).toBe('function');

            // Both should return consistent result structure
            const sslResult = await sslStrategy.processPayment(100, {});
            const bkashResult = await bkashStrategy.processPayment(100, {});

            expect(sslResult).toHaveProperty('success');
            expect(sslResult).toHaveProperty('transactionId');
            expect(sslResult).toHaveProperty('method');

            expect(bkashResult).toHaveProperty('success');
            expect(bkashResult).toHaveProperty('transactionId');
            expect(bkashResult).toHaveProperty('method');
        });

        test('should encapsulate algorithm variations', () => {
            const ssl = new SSLCommerzPayment();
            const bkash = new BkashPayment();

            // Different strategies, same interface
            expect(ssl.constructor.name).toBe('SSLCommerzPayment');
            expect(bkash.constructor.name).toBe('BkashPayment');

            // Both extend PaymentStrategy conceptually
            expect(typeof ssl.processPayment).toBe('function');
            expect(typeof bkash.processPayment).toBe('function');
        });
    });

    describe('Context Behavior', () => {
        test('should maintain selected strategy', async () => {
            const strategy = new SSLCommerzPayment();
            paymentContext.setStrategy(strategy);

            // Execute multiple times
            const result1 = await paymentContext.executePayment(100, {});
            const result2 = await paymentContext.executePayment(200, {});

            // Should use same strategy
            expect(result1.method).toBe('sslcommerz');
            expect(result2.method).toBe('sslcommerz');
        });

        test('should delegate to strategy for processing', async () => {
            const mockStrategy = {
                processPayment: jest.fn().mockResolvedValue({
                    success: true,
                    transactionId: 'MOCK_123',
                    method: 'mock'
                })
            };

            paymentContext.setStrategy(mockStrategy);
            await paymentContext.executePayment(100, { test: true });

            expect(mockStrategy.processPayment).toHaveBeenCalledWith(100, { test: true });
        });
    });

    describe('Payment Processing Scenarios', () => {
        test('should process premium content purchase via SSLCommerz', async () => {
            const sslStrategy = new SSLCommerzPayment();
            paymentContext.setStrategy(sslStrategy);

            const purchaseData = {
                user_id: 'reader-123',
                content_id: 'premium-story-456',
                content_title: 'রহস্যময় উপন্যাস',
                price: 299.00
            };

            const result = await paymentContext.executePayment(299.00, purchaseData);

            expect(result.success).toBe(true);
            expect(result.method).toBe('sslcommerz');
        });

        test('should process series subscription via bKash', async () => {
            const bkashStrategy = new BkashPayment();
            paymentContext.setStrategy(bkashStrategy);

            const subscriptionData = {
                user_id: 'subscriber-789',
                series_id: 'series-101',
                subscription_type: 'monthly',
                price: 499.00
            };

            const result = await paymentContext.executePayment(499.00, subscriptionData);

            expect(result.success).toBe(true);
            expect(result.method).toBe('bkash');
        });

        test('should handle small and large transactions', async () => {
            const sslStrategy = new SSLCommerzPayment();
            paymentContext.setStrategy(sslStrategy);

            // Small transaction
            const smallResult = await paymentContext.executePayment(10, {});
            expect(smallResult.success).toBe(true);

            // Large transaction
            const largeResult = await paymentContext.executePayment(10000, {});
            expect(largeResult.success).toBe(true);
        });
    });

    describe('Strategy Pattern Benefits', () => {
        test('should make it easy to add new payment methods', () => {
            // Create a new strategy
            class CreditCardPayment {
                async processPayment(amount, data) {
                    return {
                        success: true,
                        transactionId: 'CARD_' + Date.now(),
                        method: 'credit_card'
                    };
                }
            }

            const cardStrategy = new CreditCardPayment();
            paymentContext.setStrategy(cardStrategy);

            // Should work without modifying existing code
            expect(typeof cardStrategy.processPayment).toBe('function');
        });

        test('should allow client to choose strategy at runtime', async () => {
            const userPreference = 'bkash'; // Could come from user selection

            if (userPreference === 'bkash') {
                paymentContext.setStrategy(new BkashPayment());
            } else {
                paymentContext.setStrategy(new SSLCommerzPayment());
            }

            const result = await paymentContext.executePayment(100, {});
            expect(result.method).toBe('bkash');
        });

        test('should eliminate conditional statements in client code', async () => {
            // Instead of: if (method === 'ssl') { ... } else if (method === 'bkash') { ... }
            // We use strategy pattern

            const strategies = [
                new SSLCommerzPayment(),
                new BkashPayment()
            ];

            for (const strategy of strategies) {
                paymentContext.setStrategy(strategy);
                const result = await paymentContext.executePayment(100, {});
                expect(result.success).toBe(true);
            }
        });
    });
});
