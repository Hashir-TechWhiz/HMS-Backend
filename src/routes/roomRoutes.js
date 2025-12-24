import express from "express";
import roomController from "../controllers/rooms/roomController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/**
 * Public routes - No authentication required
 */

/**
 * @route   GET /api/rooms
 * @desc    Get all rooms with optional filters
 * @query   roomType, status, minPrice, maxPrice
 * @access  Public
 */
router.get("/", roomController.getAllRooms);

/**
 * @route   GET /api/rooms/:id
 * @desc    Get a single room by ID
 * @access  Public
 */
router.get("/:id", roomController.getRoomById);

/**
 * Admin-only routes - Require authentication and admin role
 */

/**
 * @route   POST /api/rooms
 * @desc    Create a new room
 * @access  Private/Admin
 */
router.post(
    "/",
    authenticate,
    authorize("admin"),
    roomController.createRoom
);

/**
 * @route   PATCH /api/rooms/:id
 * @desc    Update a room
 * @access  Private/Admin
 */
router.patch(
    "/:id",
    authenticate,
    authorize("admin"),
    roomController.updateRoom
);

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Delete a room
 * @access  Private/Admin
 */
router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    roomController.deleteRoom
);

export default router;

