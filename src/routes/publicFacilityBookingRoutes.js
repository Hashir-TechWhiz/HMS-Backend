import express from "express";
import publicFacilityBookingController from "../controllers/publicFacilities/publicFacilityBookingController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/**
 * Public routes - No authentication required
 */

/**
 * @route   GET /api/public-facility-bookings/check-availability
 * @desc    Check facility availability for given date/time
 * @query   facilityId, startDate, endDate, startTime (optional), endTime (optional)
 * @access  Public
 */
router.get(
    "/check-availability",
    publicFacilityBookingController.checkAvailability
);

/**
 * Authenticated routes
 */

/**
 * @route   POST /api/public-facility-bookings
 * @desc    Create a new facility booking
 * @access  Private (Guest, Receptionist, Admin)
 */
router.post(
    "/",
    authenticate,
    authorize("guest", "receptionist", "admin"),
    publicFacilityBookingController.createBooking
);

/**
 * @route   GET /api/public-facility-bookings
 * @desc    Get all bookings (filtered based on role)
 * @access  Private (Guest, Receptionist, Admin)
 */
router.get(
    "/",
    authenticate,
    authorize("guest", "receptionist", "admin"),
    publicFacilityBookingController.getAllBookings
);

/**
 * @route   GET /api/public-facility-bookings/:id
 * @desc    Get a single booking by ID
 * @access  Private (Guest, Receptionist, Admin)
 */
router.get(
    "/:id",
    authenticate,
    authorize("guest", "receptionist", "admin"),
    publicFacilityBookingController.getBookingById
);

/**
 * @route   PATCH /api/public-facility-bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private (Guest, Receptionist, Admin)
 */
router.patch(
    "/:id/cancel",
    authenticate,
    authorize("guest", "receptionist", "admin"),
    publicFacilityBookingController.cancelBooking
);

/**
 * @route   PATCH /api/public-facility-bookings/:id/confirm
 * @desc    Confirm a booking
 * @access  Private (Receptionist, Admin)
 */
router.patch(
    "/:id/confirm",
    authenticate,
    authorize("receptionist", "admin"),
    publicFacilityBookingController.confirmBooking
);

/**
 * @route   PATCH /api/public-facility-bookings/:id/check-in
 * @desc    Check-in a booking
 * @access  Private (Receptionist, Admin)
 */
router.patch(
    "/:id/check-in",
    authenticate,
    authorize("receptionist", "admin"),
    publicFacilityBookingController.checkInBooking
);

/**
 * @route   PATCH /api/public-facility-bookings/:id/check-out
 * @desc    Check-out a booking
 * @access  Private (Receptionist, Admin)
 */
router.patch(
    "/:id/check-out",
    authenticate,
    authorize("receptionist", "admin"),
    publicFacilityBookingController.checkOutBooking
);

export default router;
