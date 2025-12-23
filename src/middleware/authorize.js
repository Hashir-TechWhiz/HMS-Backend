/**
 * Middleware factory to authorize users based on roles
 * Must be used after authenticate middleware
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated (should be set by authenticate middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please login first.",
            });
        }

        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
            });
        }

        // User is authorized
        next();
    };
};

export default authorize;

