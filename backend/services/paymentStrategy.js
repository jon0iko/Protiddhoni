/**
 * Design Pattern: Strategy
 */

class PaymentStrategy {
    async processPayment(amount, data) {
        throw new Error('processPayment must be implemented');
    }
    
    verifyWebhook(payload, headers, secretKey) {
        throw new Error('verifyWebhook must be implemented');
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

    verifyWebhook(payload, headers, storePassword) {
        // In real SSLCommerz, they send verify_sign and verify_key.
        // For security, you calculate MD5 Hash using the store password.
        const crypto = require('crypto');
        
        if (!payload || !payload.verify_sign) {
            console.error('SSLCommerz Webhook Missing Signature');
            return false;
        }

        // A real integration parses verify_key to find which hash items to build.
        const verifyKeys = payload.verify_key ? payload.verify_key.split(',') : [];
        let hashString = '';
        
        verifyKeys.forEach(key => {
            hashString += key + '=' + payload[key] + '&';
        });
        
        // Append the store password securely
        hashString += 'store_passwd=' + storePassword;
        const generatedHash = crypto.createHash('md5').update(hashString).digest("hex");

        if (generatedHash !== payload.verify_sign) {
            console.error('SSLCommerz Webhook Signature Verification Failed!');
            return false;
        }

        return true;
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

    verifyWebhook(payload, headers, appSecret) {
        // bKash webhook verification typically checks X-Signature header or JSON body signature.
        // For the sake of this architectural demonstration, implementing a generic HMAC SHA256 check.
        const crypto = require('crypto');
        const signatureHeader = headers['x-bkash-signature'] || headers['authorization'];
        
        if (!signatureHeader) {
            console.error('bKash Webhook Missing Signature Header');
            return false;
        }

        const hmac = crypto.createHmac('sha256', appSecret);
        hmac.update(JSON.stringify(payload));
        const expectedSignature = hmac.digest('hex');

        // Simple string comparison (a timing-safe comparison should be used in true production)
        if (crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signatureHeader))) {
            return true;
        }

        console.error('bKash Webhook Signature Verification Failed!');
        return false;
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
