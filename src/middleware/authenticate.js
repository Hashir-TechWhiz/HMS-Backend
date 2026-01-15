import authService from "../services/authService.js";

/**
 * Middleware to authenticate JWT token from HttpOnly cookie
 * Verifies the token and attaches user information to req.user
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please login.",
            });
        }

        // Verify token
        const decoded = authService.verifyToken(token);

        // Attach user information to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            hotelId: decoded.hotelId || null, // Include hotelId for staff users
        };

        next();
    } catch (error) {
        if (error.message === "Invalid or expired token") {
            // Clear invalid cookie
            res.clearCookie("token", {
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
                path: "/",
            });

            return res.status(401).json({
                success: false,
                message: "Invalid or expired token. Please login again.",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Authentication failed.",
            error: error.message,
        });
    }
};

export default authenticate;

