module.exports = {
    // Fees & Tax
    DELIVERY_FEE: 200,
    TAX_RATE: 0.1, // 10%

    // Prescriptions
    PRESCRIPTION_STATUS: {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected',
    },

    // Orders
    ORDER_STATUS: {
        PENDING: 'pending',
        APPROVED: 'approved',
        PROCESSING: 'processing',
        SHIPPED: 'shipped',
        COMPLETED: 'completed',
    },

    // Payments
    PAYMENT_STATUS: {
        PENDING: 'pending',
        PAID: 'paid',
        FAILED: 'failed',
    },
};
