import express from "express";
import bookingController from "../controllers/bookings/bookingController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/**
 * All booking routes require authentication
 */

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (Guest, Receptionist, Admin)
 * @body    { roomId, checkInDate, checkOutDate, guestId (optional for guest, required for receptionist/admin) }
 */
router.post(
    "/",
    authenticate,
    authorize("guest", "receptionist", "admin"),
    bookingController.createBooking
);

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Get bookings for the current logged-in user (guest)
 * @access  Private (Guest only)
 * @query   page, limit
 */
router.get(
    "/my-bookings",
    authenticate,
    authorize("guest"),
    bookingController.getMyBookings
);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings (filtered based on role)
 * @access  Private (All authenticated users)
 * @query   status, guestId, roomId, page, limit
 */
router.get(
    "/",
    authenticate,
    authorize("guest", "receptionist", "admin"),
    bookingController.getAllBookings
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get a single booking by ID
 * @access  Private (Guests can only view their own)
 */
router.get(
    "/:id",
    authenticate,
    authorize("guest", "receptionist", "admin"),
    bookingController.getBookingById
);

/**
 * @route   PATCH /api/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private (Guests can only cancel their own)
 */
router.patch(
    "/:id/cancel",
    authenticate,
    authorize("guest", "receptionist", "admin"),
    bookingController.cancelBooking
);

export default router;

