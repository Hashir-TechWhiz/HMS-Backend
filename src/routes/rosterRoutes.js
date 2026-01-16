import express from "express";
import rosterController from "../controllers/roster/rosterController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/**
 * All roster routes require authentication
 */

/**
 * @route   GET /api/rosters/my-roster
 * @desc    Get roster for the current logged-in user (staff)
 * @access  Private (Receptionist, Housekeeping)
 * @query   from, to (optional date range)
 */
router.get(
    "/my-roster",
    authenticate,
    authorize("receptionist", "housekeeping"),
    rosterController.getMyRoster
);

/**
 * @route   GET /api/rosters/staff/:staffId
 * @desc    Get roster entries for a specific staff member
 * @access  Private (Admin can view any, Staff can only view their own)
 * @query   from, to (optional date range)
 */
router.get(
    "/staff/:staffId",
    authenticate,
    authorize("receptionist", "housekeeping", "admin"),
    rosterController.getStaffRoster
);

/**
 * @route   POST /api/rosters
 * @desc    Create a new roster entry
 * @access  Private (Admin only)
 * @body    { hotelId, staffId, date, shiftType, shiftStartTime, shiftEndTime, role, notes }
 */
router.post(
    "/",
    authenticate,
    authorize("admin"),
    rosterController.createRoster
);

/**
 * @route   GET /api/rosters
 * @desc    Get all roster entries (filtered based on role)
 * @access  Private (Admin sees all, Staff sees only their own)
 * @query   hotelId, staffId, date, shiftType, role, from, to, page, limit
 */
router.get(
    "/",
    authenticate,
    authorize("receptionist", "housekeeping", "admin"),
    rosterController.getAllRosters
);

/**
 * @route   GET /api/rosters/:id
 * @desc    Get a single roster entry by ID
 * @access  Private (Admin can view any, Staff can only view their own)
 */
router.get(
    "/:id",
    authenticate,
    authorize("receptionist", "housekeeping", "admin"),
    rosterController.getRosterById
);

/**
 * @route   PATCH /api/rosters/:id
 * @desc    Update a roster entry
 * @access  Private (Admin only)
 * @body    { hotelId, staffId, date, shiftType, shiftStartTime, shiftEndTime, role, notes }
 */
router.patch(
    "/:id",
    authenticate,
    authorize("admin"),
    rosterController.updateRoster
);

/**
 * @route   DELETE /api/rosters/:id
 * @desc    Delete a roster entry (permanently removes from database)
 * @access  Private (Admin only)
 */
router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    rosterController.deleteRoster
);

export default router;
