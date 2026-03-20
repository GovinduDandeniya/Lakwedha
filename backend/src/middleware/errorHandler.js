/**
 * Global Error Handler Middleware
 * Catches all unhandled errors in the application and returns a standardized JSON response.
 */

const errorHandler = (err, req, res, next) => {
    console.error(`❌ [Error] ${err.message}`);
    // Log full stack trace in development
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    const statusCode = err.statusCode || 500;
    
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

module.exports = errorHandler;
