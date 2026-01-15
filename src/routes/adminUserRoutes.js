import express from "express";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUser,
    getUserStatistics,
    getHotelStaffByRole,
} from "../controllers/admin/userController.js";

const router = express.Router();

/**
 * Admin User Management Routes
 * All routes require authentication and admin role
 * Base path: /api/admin/users
 */

// Apply authentication and authorization middleware to all routes
router.use(authenticate);
router.use(authorize("admin"));

/**
 * GET /api/admin/users/statistics
 * Get user statistics (total, active, inactive, by role)
 * Note: This must come before /:id route to avoid route conflict
 */
router.get("/statistics", getUserStatistics);

/**
 * GET /api/admin/users/hotel-staff
 * Get hotel staff by role (for assignment purposes)
 * Query params:
 *   - hotelId: required
 *   - role: optional (housekeeping|maintenance|receptionist)
 */
router.get("/hotel-staff", getHotelStaffByRole);


/**
 * GET /api/admin/users
 * Get all users with optional filters
 * Query params:
 *   - role: guest|receptionist|housekeeping|admin
 *   - isActive: true|false
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 10)
 */
router.get("/", getAllUsers);

/**
 * GET /api/admin/users/:id
 * Get single user by ID
 */
router.get("/:id", getUserById);

/**
 * PATCH /api/admin/users/:id/status
 * Update user status (activate/deactivate)
 * Body: { isActive: boolean }
 */
router.patch("/:id/status", updateUserStatus);

/**
 * PATCH /api/admin/users/:id
 * Update user details
 * Body: { name?, role?, isActive? }
 */
router.patch("/:id", updateUser);

export default router;

