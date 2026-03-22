const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'mysecretkey123';

/**
 * Verifies the Bearer token from the Authorization header.
 * On success, sets req.user = { id, role, ... } and calls next().
 */
exports.authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
};

/**
 * Restricts access to users whose role is in the allowed list.
 * Must be used after authMiddleware.
 */
exports.roleMiddleware = (allowedRoles) => (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
};
