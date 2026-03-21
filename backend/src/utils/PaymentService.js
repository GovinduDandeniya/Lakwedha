const Stripe = require('stripe');

class PaymentService {
    static getStripeInstance() {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured in environment variables');
        }
        return Stripe(secretKey);
    }

    /**
     * Create a Stripe PaymentIntent
     */
    static async createPaymentIntent(amountStr, currency, orderId) {
        const stripe = this.getStripeInstance();
        
        // Stripe expects amount in smallest currency unit (e.g., cents)
        // LKR has 2 decimal places, so multiply by 100 and round to int
        const amountInCents = Math.round(parseFloat(amountStr) * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency.toLowerCase(),
            metadata: {
                orderId: orderId,
            },
        });

        return paymentIntent;
    }

    /**
     * Verify Stripe Webhook Signature
     */
    static verifyWebhook(payload, signature) {
        const stripe = this.getStripeInstance();
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    }
}

module.exports = PaymentService;
