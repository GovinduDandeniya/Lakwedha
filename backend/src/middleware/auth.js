const jwt = require('jsonwebtoken');

/**
 * Auth middleware to protect routes
 * Checks for Bearer token in headers
 */
module.exports = (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request
        req.user = decoded;

        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
