/**
 * Payment Strategy - Strategy Pattern
 * Multiple payment methods (SSLCommerz, bKash)
 * 
 * Design Pattern: Strategy
 */

class PaymentStrategy {
    async processPayment(amount, data) {
        throw new Error('processPayment must be implemented');
    }
}

class SSLCommerzPayment extends PaymentStrategy {
    async processPayment(amount, data) {
        // TODO: Implement SSLCommerz integration
        console.log('Processing SSLCommerz payment:', amount);
        return {
            success: true,
            transactionId: 'SSL_' + Date.now(),
            method: 'sslcommerz'
        };
    }
}

class BkashPayment extends PaymentStrategy {
    async processPayment(amount, data) {
        // TODO: Implement bKash integration
        console.log('Processing bKash payment:', amount);
        return {
            success: true,
            transactionId: 'BKASH_' + Date.now(),
            method: 'bkash'
        };
    }
}

class PaymentContext {
    setStrategy(strategy) {
        this.strategy = strategy;
    }

    async executePayment(amount, data) {
        if (!this.strategy) {
            throw new Error('Payment strategy not set');
        }
        return await this.strategy.processPayment(amount, data);
    }
}

module.exports = {
    PaymentContext,
    SSLCommerzPayment,
    BkashPayment
};
