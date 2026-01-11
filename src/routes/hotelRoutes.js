import express from "express";
import hotelController from "../controllers/hotels/hotelController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/**
 * All hotel routes require authentication and admin role
 */

/**
 * @route   GET /api/hotels/active
 * @desc    Get all active hotels (for selection/dropdown)
 * @access  Private (All authenticated users)
 */
router.get(
    "/active",
    authenticate,
    hotelController.getActiveHotels
);

/**
 * @route   GET /api/hotels
 * @desc    Get all hotels with optional filters
 * @query   status, city, country, page, limit
 * @access  Private/Admin
 */
router.get(
    "/",
    authenticate,
    authorize("admin"),
    hotelController.getAllHotels
);

/**
 * @route   GET /api/hotels/:id
 * @desc    Get a single hotel by ID
 * @access  Private/Admin
 */
router.get(
    "/:id",
    authenticate,
    authorize("admin"),
    hotelController.getHotelById
);

/**
 * @route   POST /api/hotels
 * @desc    Create a new hotel
 * @access  Private/Admin
 */
router.post(
    "/",
    authenticate,
    authorize("admin"),
    hotelController.createHotel
);

/**
 * @route   PATCH /api/hotels/:id
 * @desc    Update a hotel
 * @access  Private/Admin
 */
router.patch(
    "/:id",
    authenticate,
    authorize("admin"),
    hotelController.updateHotel
);

/**
 * @route   DELETE /api/hotels/:id
 * @desc    Delete a hotel
 * @access  Private/Admin
 */
router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    hotelController.deleteHotel
);

export default router;
