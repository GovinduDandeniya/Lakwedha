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
    static async createCheckoutSession(amountStr, currency, orderId) {
        const stripe = this.getStripeInstance();
        
        const amountInCents = Math.round(parseFloat(amountStr) * 100);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency.toLowerCase(),
                        product_data: {
                            name: 'Lakwedha E-Channeling Prescription Order',
                            images: ['https://cdn-icons-png.flaticon.com/512/883/883407.png'],
                        },
                        unit_amount: amountInCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Return URLs will just kick us back to the app domain (e.g. localhost for testing)
            success_url: process.env.BACKEND_BASE_URL || 'http://localhost:8080/#/success',
            cancel_url: process.env.BACKEND_BASE_URL || 'http://localhost:8080/#/cancel',
            metadata: {
                orderId: orderId,
            },
            payment_intent_data: {
                metadata: {
                    orderId: orderId,
                }
            }
        });

        return session;
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
