const logger = require('../utils/logger');

/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns a standardized JSON response.
 * Must be registered as the LAST middleware in server.js.
 */
const errorHandler = (err, req, res, next) => {
    logger.error('Error in route: %s', err.message, { stack: err.stack, path: req.path });

    const statusCode = err.statusCode || err.status || 500;

    res.status(statusCode).json({
        success: false,
        data: null,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
};

module.exports = errorHandler;
