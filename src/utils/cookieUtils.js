/**
 * Utility functions for cookie management
 */

/**
 * Convert JWT_EXPIRES_IN string to milliseconds for cookie maxAge
 * @param {string} expiresIn - JWT expiration string (e.g., "7d", "24h", "3600s")
 * @returns {number} Milliseconds
 */
export function getCookieMaxAge(expiresIn) {
    if (!expiresIn) {
        expiresIn = "7d"; // Default to 7 days
    }

    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
        case "s": // seconds
            return value * 1000;
        case "m": // minutes
            return value * 60 * 1000;
        case "h": // hours
            return value * 60 * 60 * 1000;
        case "d": // days
            return value * 24 * 60 * 60 * 1000;
        default:
            // If no unit, assume seconds
            return parseInt(expiresIn, 10) * 1000;
    }
}

/**
 * Get cookie options for authentication cookie
 * @returns {Object} Cookie options
 */
export function getAuthCookieOptions() {
    const maxAge = getCookieMaxAge(process.env.JWT_EXPIRES_IN);

    return {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: maxAge,
        path: "/", // Available to all routes
    };
}

