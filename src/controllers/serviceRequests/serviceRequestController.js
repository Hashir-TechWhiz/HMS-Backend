import serviceRequestService from "../../services/serviceRequestService.js";

class ServiceRequestController {
    /**
     * Create a new service request
     * POST /api/service-requests
     * Guest only - for their own bookings
     */
    async createServiceRequest(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware

            const serviceRequest = await serviceRequestService.createServiceRequest(
                req.body,
                currentUser
            );

            res.status(201).json({
                success: true,
                message: "Service request created successfully",
                data: serviceRequest,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get service requests for the logged-in guest
     * GET /api/service-requests/my-requests
     * Guest only
     * Query params: from, to, page, limit
     */
    async getMyServiceRequests(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware

            const filters = {
                from: req.query.from,
                to: req.query.to,
            };

            const pagination = {
                page: req.query.page,
                limit: req.query.limit,
            };

            const result = await serviceRequestService.getMyServiceRequests(
                currentUser,
                filters,
                pagination
            );

            res.status(200).json({
                success: true,
                count: result.serviceRequests.length,
                pagination: result.pagination,
                data: result.serviceRequests,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all service requests
     * GET /api/service-requests
     * Admin and receptionist only
     * Query params: status, serviceType, assignedRole, roomId, from, to, page, limit
     */
    async getAllServiceRequests(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware

            const filters = {
                status: req.query.status,
                serviceType: req.query.serviceType,
                assignedRole: req.query.assignedRole,
                roomId: req.query.roomId,
                from: req.query.from,
                to: req.query.to,
            };

            const pagination = {
                page: req.query.page,
                limit: req.query.limit,
            };

            const result = await serviceRequestService.getAllServiceRequests(
                filters,
                pagination,
                currentUser
            );

            res.status(200).json({
                success: true,
                count: result.serviceRequests.length,
                pagination: result.pagination,
                data: result.serviceRequests,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get assigned service requests for housekeeping staff
     * GET /api/service-requests/assigned
     * Housekeeping only
     * Query params: from, to, page, limit
     */
    async getAssignedServiceRequests(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware

            const filters = {
                from: req.query.from,
                to: req.query.to,
            };

            const pagination = {
                page: req.query.page,
                limit: req.query.limit,
            };

            const result = await serviceRequestService.getAssignedServiceRequests(
                currentUser,
                filters,
                pagination
            );

            res.status(200).json({
                success: true,
                count: result.serviceRequests.length,
                pagination: result.pagination,
                data: result.serviceRequests,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update service request status
     * PATCH /api/service-requests/:id/status
     * Housekeeping and admin only
     */
    async updateServiceRequestStatus(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware
            const { status, finalPrice } = req.body;

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: "Status is required",
                });
            }

            const serviceRequest = await serviceRequestService.updateServiceRequestStatus(
                req.params.id,
                status,
                currentUser,
                finalPrice
            );

            res.status(200).json({
                success: true,
                message: "Service request status updated successfully",
                data: serviceRequest,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Assign service request to a staff member
     * PATCH /api/service-requests/:id/assign
     * Admin only
     */
    async assignServiceRequest(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware
            const { staffId } = req.body;

            if (!staffId) {
                return res.status(400).json({
                    success: false,
                    message: "Staff ID is required",
                });
            }

            const serviceRequest = await serviceRequestService.assignServiceRequest(
                req.params.id,
                staffId,
                currentUser
            );

            res.status(200).json({
                success: true,
                message: "Service request assigned successfully",
                data: serviceRequest,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single service request by ID
     * GET /api/service-requests/:id
     * Access controlled by role
     */
    async getServiceRequestById(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware

            const serviceRequest = await serviceRequestService.getServiceRequestById(
                req.params.id,
                currentUser
            );

            res.status(200).json({
                success: true,
                data: serviceRequest,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ServiceRequestController();

