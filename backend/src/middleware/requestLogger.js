/**
 * Request Logger Middleware
 * Logs incoming HTTP requests with method, URL, and timestamp.
 * Helps with debugging OTP and Notification flows.
 */

const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    
    // Optional: Log body for notification/OTP endpoints (excluding sensitive data if scaled)
    if (req.url.includes('/api/v1/otp') || req.url.includes('/api/v1/notification')) {
        console.log(`  Body:`, JSON.stringify(req.body, null, 2));
    }
    
    next();
};

module.exports = requestLogger;
