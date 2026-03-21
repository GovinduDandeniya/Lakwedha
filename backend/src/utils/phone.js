/**
 * Format a Sri Lanka mobile number to Notify.lk format.
 * Notify.lk expects plain digits with country code, no '+'.
 *
 * Accepted inputs:
 *   "0713316679"     → "94713316679"  (local format)
 *   "+94713316679"   → "94713316679"  (E.164)
 *   "94713316679"    → "94713316679"  (already correct)
 *   "713316679"      → "94713316679"  (bare 9-digit)
 */
const formatLKNumber = (mobile) => {
    const digits = String(mobile).replace(/\D/g, ''); // strip non-digits

    // Country code already present but followed by a leading 0: 940XXXXXXXXX → 94XXXXXXXXX
    if (digits.startsWith('940') && digits.length === 12) return '94' + digits.slice(3);
    if (digits.startsWith('94')) return digits;          // already correct E.164 digits
    if (digits.startsWith('0'))  return '94' + digits.slice(1); // 07XXXXXXXX → 94XXXXXXXXX
    return '94' + digits;                                // bare 9-digit → add 94
};

module.exports = formatLKNumber;
