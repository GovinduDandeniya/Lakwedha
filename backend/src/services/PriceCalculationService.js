/**
 * Service: PriceCalculationService
 * Enforces price calculations on the server side to prevent client tampering
 */

// Basic constants that would ideally be in a DB or env (student level: simple constants)
const DELIVERY_FEE = 350; // LKR
const TAX_RATE = 0.05; // 5%

class PriceCalculationService {
    /**
     * Calculates the subtotal, tax, delivery fee, and total amount
     * @param {Array} medicines - [{ name, quantity, price }]
     * @returns {Object} - Breakdown of costs
     */
    static calculateTotal(medicines) {
        if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
            return {
                subtotal: 0,
                deliveryFee: DELIVERY_FEE,
                tax: 0,
                totalAmount: DELIVERY_FEE
            };
        }

        const subtotal = medicines.reduce((sum, med) => {
            const price = Number(med.price) || 0;
            const qty = Number(med.quantity) || 0;
            return sum + (price * qty);
        }, 0);

        const tax = Number((subtotal * TAX_RATE).toFixed(2));
        const totalAmount = Number((subtotal + tax + DELIVERY_FEE).toFixed(2));

        return {
            subtotal,
            deliveryFee: DELIVERY_FEE,
            tax,
            totalAmount
        };
    }
}

module.exports = PriceCalculationService;
