/**
 * Utility: asyncHandler
 * Catches errors in async routes and forwards them to explicitly handle errors without try/catch repetitons
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
