import express from "express";
import reportController from "../controllers/reports/reportController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/**
 * All reporting routes require authentication and admin/receptionist role
 */

/**
 * @route   GET /api/reports/overview
 * @desc    Get all reports in a single call (bookings, rooms, service requests)
 * @access  Private (Admin, Receptionist only)
 */
router.get(
    "/overview",
    authenticate,
    authorize("admin", "receptionist"),
    reportController.getAllReports
);

/**
 * @route   GET /api/reports/bookings
 * @desc    Get booking summary report
 * @access  Private (Admin, Receptionist only)
 */
router.get(
    "/bookings",
    authenticate,
    authorize("admin", "receptionist"),
    reportController.getBookingSummary
);

/**
 * @route   GET /api/reports/rooms
 * @desc    Get room overview report
 * @access  Private (Admin, Receptionist only)
 */
router.get(
    "/rooms",
    authenticate,
    authorize("admin", "receptionist"),
    reportController.getRoomOverview
);

/**
 * @route   GET /api/reports/service-requests
 * @desc    Get service request overview report
 * @access  Private (Admin, Receptionist only)
 */
router.get(
    "/service-requests",
    authenticate,
    authorize("admin", "receptionist"),
    reportController.getServiceRequestOverview
);

export default router;

