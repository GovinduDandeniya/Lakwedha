const errorHandler = (err, req, res, next) => {
    // Basic console error for student-level projects
    console.error(`[Error] ${err.status || 500} - ${err.message}`);

    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message: message,
        // Show stack trace only if not in production to help debugging
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
};

module.exports = errorHandler;
