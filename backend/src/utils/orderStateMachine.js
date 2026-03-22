/**
 * Utility: orderStateMachine
 * Explicit state machine for order lifecycle to prevent random status changes.
 */

const ORDER_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const VALID_TRANSITIONS = {
    [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.APPROVED, ORDER_STATUSES.REJECTED],
    [ORDER_STATUSES.APPROVED]: [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED],
    [ORDER_STATUSES.PROCESSING]: [ORDER_STATUSES.APPROVED, ORDER_STATUSES.SHIPPED, ORDER_STATUSES.CANCELLED],
    [ORDER_STATUSES.SHIPPED]: [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED],
    [ORDER_STATUSES.COMPLETED]: [ORDER_STATUSES.SHIPPED], // Rare but possible
    [ORDER_STATUSES.CANCELLED]: [ORDER_STATUSES.APPROVED], // Allow re-opening
    [ORDER_STATUSES.REJECTED]: [ORDER_STATUSES.PENDING]
};

class OrderStateMachine {
    /**
     * Checks if moving from currentStatus to newStatus is allowed.
     * @param {string} currentStatus
     * @param {string} newStatus
     * @returns {boolean}
     */
    static isValidTransition(currentStatus, newStatus) {
        if (!VALID_TRANSITIONS[currentStatus]) return false;
        return VALID_TRANSITIONS[currentStatus].includes(newStatus);
    }

    /**
     * Asserts transition is valid; throws an error otherwise.
     * @param {string} currentStatus
     * @param {string} newStatus
     */
    static assertValidTransition(currentStatus, newStatus) {
        if (currentStatus === newStatus) return; // Ignore if same

        if (!this.isValidTransition(currentStatus, newStatus)) {
            throw new Error(`Invalid status transition: Cannot move order from '${currentStatus}' to '${newStatus}'.`);
        }
    }
}

module.exports = { OrderStateMachine, ORDER_STATUSES };
