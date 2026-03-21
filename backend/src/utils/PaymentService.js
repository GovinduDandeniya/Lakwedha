const Stripe = require('stripe');

/**
 * Payment Service (Ayurveda Stripe Integration)
 * Secure, end-to-end payment management.
 */
class PaymentService {
    static getStripeInstance() {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured in backend environment.');
        }
        return Stripe(secretKey);
    }

    /**
     * Strategy A: Checkout Session (External Hosted Portal)
     * For cross-platform browser-based payments.
     */
    static async createCheckoutSession(amountStr, currency, orderId) {
        const stripe = this.getStripeInstance();
        const amountInCents = Math.round(parseFloat(amountStr) * 100);

        return await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: (currency || 'lkr').toLowerCase(),
                        product_data: {
                            name: 'Lakwedha Prescription Order',
                            description: `Reference: #${orderId.toString().slice(-8).toUpperCase()}`,
                            images: ['https://cdn-icons-png.flaticon.com/512/883/883407.png'],
                        },
                        unit_amount: amountInCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.BACKEND_BASE_URL || 'http://localhost:5000'}/api/orders/pay/notify?orderId=${orderId}`,
            cancel_url: `${process.env.BACKEND_BASE_URL || 'http://localhost:5000'}/api/orders/pay/notify?orderId=${orderId}&cancel=true`,
            metadata: { orderId: orderId.toString() },
            payment_intent_data: {
                metadata: { orderId: orderId.toString() }
            }
        });
    }

    /**
     * Strategy B: Direct PaymentIntent (Native Mobile SDK)
     * To power the Flutter flutter_stripe native payment sheet.
     */
    static async createPaymentIntent(amountStr, currency, orderId) {
        const stripe = this.getStripeInstance();
        const amountInCents = Math.round(parseFloat(amountStr) * 100);

        return await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: (currency || 'lkr').toLowerCase(),
            metadata: { 
                orderId: orderId.toString(),
                system: 'Lakwedha_Ayurveda'
            },
            description: `Order #${orderId.toString().slice(-8).toUpperCase()}`
        });
    }

    /**
     * Verify Live Status directly from Stripe Source
     * Critical for preventing spoofing.
     */
    static async retrievePaymentIntent(intentId) {
        const stripe = this.getStripeInstance();
        return await stripe.paymentIntents.retrieve(intentId);
    }

    /**
     * Webhook Signature Verification
     * Ensures messages really came from Stripe.
     */
    static verifyWebhook(payload, signature) {
        const stripe = this.getStripeInstance();
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!endpointSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET not defined. Webhooks will fail.');
        }
        return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    }
}

module.exports = PaymentService;
