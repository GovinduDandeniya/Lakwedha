/**
 * Middleware for defining role-based access limits
 * @param  {...string} roles Allowed roles
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Role not specified in token.' });
        }

        const userRole = req.user.role.toUpperCase();
        const allowedRoles = roles.map(role => role.toUpperCase());

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: `Forbidden: User role ${req.user.role} is not authorized to access this route.`
            });
        }
        // User is authorized → proceed to next middleware/controller
        next();
    };
};

module.exports = authorizeRoles;
