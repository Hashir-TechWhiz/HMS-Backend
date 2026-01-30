import express from "express";
import publicFacilityController from "../controllers/publicFacilities/publicFacilityController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import injectHotelId from "../middleware/injectHotelId.js";

const router = express.Router();

/**
 * Public routes - No authentication required
 */

/**
 * @route   GET /api/public-facilities
 * @desc    Get all facilities with optional filters
 * @query   hotelId, facilityType, status, minPrice, maxPrice, page, limit
 * @access  Public
 */
router.get("/", publicFacilityController.getAllFacilities);

/**
 * @route   GET /api/public-facilities/hotel/:hotelId
 * @desc    Get all facilities for a specific hotel
 * @access  Public
 */
router.get("/hotel/:hotelId", publicFacilityController.getFacilitiesByHotel);

/**
 * @route   GET /api/public-facilities/:id
 * @desc    Get a single facility by ID
 * @access  Public
 */
router.get("/:id", publicFacilityController.getFacilityById);

/**
 * Admin-only routes - Require authentication and admin role
 */

/**
 * @route   POST /api/public-facilities
 * @desc    Create a new facility
 * @access  Private/Admin
 */
router.post(
    "/",
    authenticate,
    authorize("admin"),
    injectHotelId,
    publicFacilityController.createFacility
);

/**
 * @route   PATCH /api/public-facilities/:id
 * @desc    Update a facility
 * @access  Private/Admin
 */
router.patch(
    "/:id",
    authenticate,
    authorize("admin"),
    publicFacilityController.updateFacility
);

/**
 * @route   DELETE /api/public-facilities/:id
 * @desc    Delete a facility
 * @access  Private/Admin
 */
router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    publicFacilityController.deleteFacility
);

export default router;
