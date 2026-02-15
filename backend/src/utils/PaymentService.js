const crypto = require('crypto');

/**
 * PayHere Payment Gateway Utility
 */
class PaymentService {
    /**
     * Generate PayHere MD5 Signature
     * @param {string} merchantId
     * @param {string} orderId
     * @param {number} amount
     * @param {string} currency
     * @param {string} merchantSecret
     */
    static generateSignature(merchantId, orderId, amount, currency, merchantSecret) {
        const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        const amountFormatted = parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, useGrouping: false });

        const mainStr = merchantId + orderId + amountFormatted + currency + hashedSecret;
        return crypto.createHash('md5').update(mainStr).digest('hex').toUpperCase();
    }

    /**
     * Verify PayHere Notification
     */
    static verifyNotification(body, merchantSecret) {
        const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = body;

        const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        const mainStr = merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret;
        const expectedSig = crypto.createHash('md5').update(mainStr).digest('hex').toUpperCase();

        return expectedSig === md5sig;
    }
}

module.exports = PaymentService;
