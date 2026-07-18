import crypto from 'crypto';
/**
 * Design Pattern: Strategy
 */

interface PaymentResult {
    success: boolean;
    transactionId?: string;
    method?: string;
    processedAt?: string | Date;
    error?: string;
    [key: string]: any;
}

class PaymentStrategy {
    async processPayment(amount: number, data?: any): Promise<PaymentResult> {
        throw new Error('processPayment must be implemented');
    }

    verifyWebhook(payload: any, headers: any, secretKey: string): boolean {
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

/**
 * SimPayment — in-backend simulator. No external provider.
 * Generates a deterministic-looking transaction id, optionally simulates
 * latency and a configurable failure rate so the UI flows can be exercised.
 */
class SimPayment extends PaymentStrategy {
    async processPayment(amount: number, data: any = {}) {
        const latencyMs = Number.isFinite(data.simLatencyMs) ? data.simLatencyMs : 600;
        if (latencyMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, latencyMs));
        }

        const failureRate = Number.isFinite(data.simFailureRate) ? data.simFailureRate : 0;
        const forceOutcome = data.simOutcome;
        const failed = forceOutcome === 'failure' || (forceOutcome !== 'success' && Math.random() < failureRate);

        const transactionId = `SIM_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        if (failed) {
            return {
                success: false,
                transactionId,
                method: 'sim',
                status: 'FAILED',
                error: 'Simulated payment declined'
            };
        }

        return {
            success: true,
            transactionId,
            method: 'sim',
            status: 'COMPLETED',
            amount,
            processedAt: new Date().toISOString()
        };
    }

    verifyWebhook() {
        return true;
    }
}

class PaymentContext {
    private strategy: PaymentStrategy | undefined;

    setStrategy(strategy: PaymentStrategy) {
        this.strategy = strategy;
    }

    async executePayment(amount, data) {
        if (!this.strategy) {
            throw new Error('Payment strategy not set');
        }
        return await this.strategy.processPayment(amount, data);
    }
}

export { PaymentContext, SSLCommerzPayment, BkashPayment, SimPayment };
