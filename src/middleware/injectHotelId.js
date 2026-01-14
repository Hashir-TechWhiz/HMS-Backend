import User from "../models/User.js";

/**
 * Middleware to inject hotelId into request for hotel-scoped operations
 * Must be used after authenticate middleware
 * 
 * For admin: hotelId can be provided in request body/query (optional)
 * For receptionist/housekeeping: hotelId is automatically set from user profile
 * For guest: hotelId must be provided in request
 */
const injectHotelId = async (req, res, next) => {
    try {
        // Check if user is authenticated (should be set by authenticate middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please login first.",
            });
        }

        const userRole = req.user.role;

        // Admin can work with any hotel - hotelId is optional
        if (userRole === "admin") {
            // Admin can specify hotelId in body or query, or leave it empty to see all
            const hotelId = req.body.hotelId || req.query.hotelId;
            if (hotelId) {
                req.hotelId = hotelId;
            }
            // If no hotelId provided, admin can see all hotels (req.hotelId remains undefined)
            return next();
        }

        // For receptionist and housekeeping, get hotelId from user profile
        if (userRole === "receptionist" || userRole === "housekeeping") {
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            if (!user.hotelId) {
                return res.status(403).json({
                    success: false,
                    message: `${userRole} must be assigned to a hotel`,
                });
            }

            // Automatically inject hotelId from user profile
            req.hotelId = user.hotelId.toString();

            // Override any hotelId in request body/query to prevent access to other hotels
            if (req.body) {
                req.body.hotelId = user.hotelId.toString();
            }

            return next();
        }

        // For guest, hotelId should be provided in the request
        if (userRole === "guest") {
            const hotelId = req.body.hotelId || req.query.hotelId;
            if (hotelId) {
                req.hotelId = hotelId;
            }
            return next();
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error processing hotel context",
            error: error.message,
        });
    }
};

export default injectHotelId;
