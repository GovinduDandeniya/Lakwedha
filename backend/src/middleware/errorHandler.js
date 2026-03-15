// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || 'An unexpected error occurred. Please try again later.';

    res.status(statusCode).json({
        success: false,
        data: null,
        message: message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
};

module.exports = errorHandler;
