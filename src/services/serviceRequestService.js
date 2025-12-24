import ServiceRequest from "../models/ServiceRequest.js";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import mongoose from "mongoose";

class ServiceRequestService {
    /**
     * Create a new service request
     * @param {Object} requestData - Service request data
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Created service request
     */
    async createServiceRequest(requestData, currentUser) {
        const { bookingId, serviceType, notes } = requestData;

        // Validate required fields
        if (!bookingId || !serviceType) {
            throw new Error("Booking ID and service type are required");
        }

        // Validate booking exists
        const booking = await Booking.findById(bookingId).populate("room");
        if (!booking) {
            throw new Error("Booking not found");
        }

        // Guest can only create service requests for their own bookings
        if (currentUser.role === "guest") {
            if (booking.guest.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only create service requests for your own bookings");
            }
        } else {
            throw new Error("Only guests can create service requests");
        }

        // Check if booking is active (not cancelled)
        if (booking.status === "cancelled") {
            throw new Error("Cannot create service request for a cancelled booking");
        }

        // Get room from booking
        const roomId = booking.room._id || booking.room;

        // Validate room exists
        const room = await Room.findById(roomId);
        if (!room) {
            throw new Error("Room not found");
        }

        // Create new service request
        // The assignedRole will be automatically set by the pre-save hook
        const newServiceRequest = new ServiceRequest({
            booking: bookingId,
            room: roomId,
            requestedBy: currentUser.id,
            serviceType,
            notes: notes || "",
            status: "pending",
        });

        await newServiceRequest.save();

        // Populate related fields
        await newServiceRequest.populate([
            { path: "booking", select: "checkInDate checkOutDate status" },
            { path: "room", select: "roomNumber roomType" },
            { path: "requestedBy", select: "name email role" },
        ]);

        return newServiceRequest.toJSON();
    }

    /**
     * Get service requests for the logged-in guest
     * @param {Object} currentUser - Current user making the request
     * @param {Object} pagination - Pagination options
     * @returns {Object} Paginated service requests
     */
    async getMyServiceRequests(currentUser, pagination = {}) {
        if (currentUser.role !== "guest") {
            throw new Error("This endpoint is only for guests");
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { requestedBy: currentUser.id };

        // Get total count
        const totalRequests = await ServiceRequest.countDocuments(query);

        // Get paginated service requests
        const serviceRequests = await ServiceRequest.find(query)
            .populate("booking", "checkInDate checkOutDate status")
            .populate("room", "roomNumber roomType")
            .populate("requestedBy", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalRequests / limit);

        return {
            serviceRequests: serviceRequests.map((sr) => sr.toJSON()),
            pagination: {
                totalRequests,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }

    /**
     * Get all service requests (admin/receptionist)
     * @param {Object} filters - Optional filters
     * @param {Object} pagination - Pagination options
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Paginated service requests
     */
    async getAllServiceRequests(filters = {}, pagination = {}, currentUser) {
        // Only admin and receptionist can view all service requests
        if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            throw new Error("Access denied. Only admin and receptionist can view all service requests");
        }

        const query = {};

        // Apply filters
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.serviceType) {
            query.serviceType = filters.serviceType;
        }
        if (filters.assignedRole) {
            query.assignedRole = filters.assignedRole;
        }
        if (filters.roomId) {
            query.room = filters.roomId;
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count
        const totalRequests = await ServiceRequest.countDocuments(query);

        // Get paginated service requests
        const serviceRequests = await ServiceRequest.find(query)
            .populate("booking", "checkInDate checkOutDate status")
            .populate("room", "roomNumber roomType")
            .populate("requestedBy", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalRequests / limit);

        return {
            serviceRequests: serviceRequests.map((sr) => sr.toJSON()),
            pagination: {
                totalRequests,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }

    /**
     * Get assigned service requests for housekeeping staff
     * @param {Object} currentUser - Current user making the request
     * @param {Object} pagination - Pagination options
     * @returns {Object} Paginated service requests
     */
    async getAssignedServiceRequests(currentUser, pagination = {}) {
        // Only housekeeping staff can access this endpoint
        if (currentUser.role !== "housekeeping") {
            throw new Error("Access denied. Only housekeeping staff can access assigned tasks");
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        // Filter by assigned role matching the user's role
        const query = { assignedRole: "housekeeping" };

        // Get total count
        const totalRequests = await ServiceRequest.countDocuments(query);

        // Get paginated service requests
        const serviceRequests = await ServiceRequest.find(query)
            .populate("booking", "checkInDate checkOutDate status")
            .populate("room", "roomNumber roomType")
            .populate("requestedBy", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalRequests / limit);

        return {
            serviceRequests: serviceRequests.map((sr) => sr.toJSON()),
            pagination: {
                totalRequests,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }

    /**
     * Update service request status
     * @param {string} requestId - Service request ID
     * @param {string} newStatus - New status
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Updated service request
     */
    async updateServiceRequestStatus(requestId, newStatus, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            throw new Error("Invalid service request ID");
        }

        // Validate new status
        const validStatuses = ["pending", "in_progress", "completed"];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
        }

        // Find the service request
        const serviceRequest = await ServiceRequest.findById(requestId)
            .populate("booking", "checkInDate checkOutDate status")
            .populate("room", "roomNumber roomType")
            .populate("requestedBy", "name email role");

        if (!serviceRequest) {
            throw new Error("Service request not found");
        }

        // Authorization check
        if (currentUser.role === "housekeeping") {
            // Housekeeping can only update requests assigned to them
            if (serviceRequest.assignedRole !== "housekeeping") {
                throw new Error("Access denied. This task is not assigned to housekeeping");
            }
        } else if (currentUser.role !== "admin") {
            // Only housekeeping and admin can update status
            throw new Error("Access denied. Only housekeeping staff and admin can update service request status");
        }

        // Update status
        serviceRequest.status = newStatus;
        await serviceRequest.save();

        return serviceRequest.toJSON();
    }

    /**
     * Get a single service request by ID
     * @param {string} requestId - Service request ID
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Service request
     */
    async getServiceRequestById(requestId, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            throw new Error("Invalid service request ID");
        }

        const serviceRequest = await ServiceRequest.findById(requestId)
            .populate("booking", "checkInDate checkOutDate status")
            .populate("room", "roomNumber roomType")
            .populate("requestedBy", "name email role");

        if (!serviceRequest) {
            throw new Error("Service request not found");
        }

        // Role-based access control
        if (currentUser.role === "guest") {
            // Guests can only view their own service requests
            if (serviceRequest.requestedBy._id.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only view your own service requests");
            }
        } else if (currentUser.role === "housekeeping") {
            // Housekeeping can only view requests assigned to them
            if (serviceRequest.assignedRole !== "housekeeping") {
                throw new Error("Access denied. This task is not assigned to housekeeping");
            }
        } else if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            throw new Error("Unauthorized to view service requests");
        }

        return serviceRequest.toJSON();
    }
}

export default new ServiceRequestService();

