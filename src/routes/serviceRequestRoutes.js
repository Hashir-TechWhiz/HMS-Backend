import express from "express";
import serviceRequestController from "../controllers/serviceRequests/serviceRequestController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/**
 * All service request routes require authentication
 */

/**
 * @route   POST /api/service-requests
 * @desc    Create a new service request
 * @access  Private (Guest only - for own bookings)
 * @body    { bookingId, serviceType, notes (optional) }
 */
router.post(
    "/",
    authenticate,
    authorize("guest"),
    serviceRequestController.createServiceRequest
);

/**
 * @route   GET /api/service-requests/my-requests
 * @desc    Get service requests for the logged-in guest
 * @access  Private (Guest only)
 * @query   page, limit
 */
router.get(
    "/my-requests",
    authenticate,
    authorize("guest"),
    serviceRequestController.getMyServiceRequests
);

/**
 * @route   GET /api/service-requests/assigned
 * @desc    Get assigned service requests for housekeeping staff
 * @access  Private (Housekeeping only)
 * @query   page, limit
 */
router.get(
    "/assigned",
    authenticate,
    authorize("housekeeping"),
    serviceRequestController.getAssignedServiceRequests
);

/**
 * @route   GET /api/service-requests
 * @desc    Get all service requests
 * @access  Private (Admin and Receptionist only)
 * @query   status, serviceType, assignedRole, roomId, page, limit
 */
router.get(
    "/",
    authenticate,
    authorize("admin", "receptionist"),
    serviceRequestController.getAllServiceRequests
);

/**
 * @route   GET /api/service-requests/:id
 * @desc    Get a single service request by ID
 * @access  Private (Role-based access)
 */
router.get(
    "/:id",
    authenticate,
    authorize("guest", "housekeeping", "receptionist", "admin"),
    serviceRequestController.getServiceRequestById
);

/**
 * @route   PATCH /api/service-requests/:id/status
 * @desc    Update service request status
 * @access  Private (Housekeeping and Admin only)
 * @body    { status }
 */
router.patch(
    "/:id/status",
    authenticate,
    authorize("housekeeping", "admin"),
    serviceRequestController.updateServiceRequestStatus
);

export default router;

