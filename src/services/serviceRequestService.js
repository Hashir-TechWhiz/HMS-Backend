import ServiceRequest from "../models/ServiceRequest.js";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import ServiceCatalog from "../models/ServiceCatalog.js";
import mongoose from "mongoose";

class ServiceRequestService {
    /**
     * Create a new service request
     * @param {Object} requestData - Service request data
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Created service request
     */
    async createServiceRequest(requestData, currentUser) {
        const { bookingId, serviceType, notes, priority } = requestData;

        // Validate required fields
        if (!bookingId || !serviceType) {
            throw new Error("Booking ID and service type are required");
        }

        // Validate booking exists and populate hotelId
        const booking = await Booking.findById(bookingId).populate("room");
        if (!booking) {
            throw new Error("Booking not found");
        }

        // Guest can only create service requests for their own bookings
        if (currentUser.role === "guest") {
            // Walk-in bookings don't have a guest field, so they can't have service requests
            if (!booking.guest) {
                throw new Error("Service requests can only be created for guest bookings");
            }
            if (booking.guest.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only create service requests for your own bookings");
            }
        } else if (currentUser.role !== "receptionist" && currentUser.role !== "admin") {
            throw new Error("Only guests, receptionists, or admins can create service requests");
        }

        // Validate booking status - must be checked in (active stay) for guests
        if (currentUser.role === "guest" && booking.status !== "checkedin") {
            if (booking.status === "cancelled") {
                throw new Error("Cannot create service request for a cancelled booking");
            } else if (booking.status === "completed") {
                throw new Error("Cannot create service request for a completed stay");
            } else if (booking.status === "confirmed") {
                throw new Error("Service requests are only available during an active stay. Please check in first");
            } else if (booking.status === "pending") {
                throw new Error("Service requests are only available during an active stay. Booking must be confirmed and checked in");
            } else {
                throw new Error("Service requests are only available during an active stay (after check-in)");
            }
        }

        // Check for duplicate service requests (same type, pending or in_progress)
        // Only apply this check for guests to prevent spamming
        if (currentUser.role === "guest") {
            const existingRequest = await ServiceRequest.findOne({
                requestedBy: currentUser.id,
                serviceType: serviceType,
                status: { $in: ["pending", "in_progress"] }
            });

            if (existingRequest) {
                throw new Error(`You already have a ${serviceType.replace(/_/g, ' ')} request that is pending or in progress. Please wait for it to be completed before submitting a new request of the same type.`);
            }
        }

        // Get room from booking
        const roomId = booking.room._id || booking.room;

        // Fetch pricing from Service Catalog (if available)
        let fixedPrice = null;
        let description = requestData.description || "";

        // Only fetch pricing for non-"other" service types
        if (serviceType !== "other") {
            const catalogEntry = await ServiceCatalog.findOne({
                hotelId: booking.hotelId,
                serviceType: serviceType,
                isActive: true
            });

            if (catalogEntry) {
                fixedPrice = catalogEntry.fixedPrice;
                // Use catalog description if no custom description provided
                if (!description) {
                    description = catalogEntry.description || "";
                }
            }
        }

        // Create new service request with hotelId from booking
        const newServiceRequest = new ServiceRequest({
            hotelId: booking.hotelId, // Inherit hotelId from booking
            booking: bookingId,
            room: roomId,
            requestedBy: currentUser.id,
            serviceType,
            description,
            fixedPrice, // Set from catalog (null for "other" type)
            notes: notes || "",
            priority: priority || "normal",
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
     * Create a checkout cleaning request
     * @param {string} hotelId - Hotel ID
     * @param {string} bookingId - Booking ID
     * @param {string} roomId - Room ID
     * @returns {Object} Created service request
     */
    async createCheckoutCleaningRequest(hotelId, bookingId, roomId) {
        // Find available housekeeping staff for this hotel to auto-assign
        const HousekeepingStaff = await mongoose.model("User").find({
            hotelId,
            role: "housekeeping",
            isActive: true,
        });

        let assignedTo = null;
        if (HousekeepingStaff.length > 0) {
            // Simple round-robin or least-workload could be used here
            // For now, let's pick the one with least pending tasks
            const staffWorkload = await Promise.all(
                HousekeepingStaff.map(async (staff) => {
                    const pendingTasks = await ServiceRequest.countDocuments({
                        assignedTo: staff._id,
                        status: { $in: ["pending", "in_progress"] }
                    });
                    return { staff, pendingTasks };
                })
            );
            staffWorkload.sort((a, b) => a.pendingTasks - b.pendingTasks);
            assignedTo = staffWorkload[0].staff._id;
        }

        const newServiceRequest = new ServiceRequest({
            hotelId,
            booking: bookingId,
            room: roomId,
            requestedBy: assignedTo || null, // Auto-created by system, assign to staff if available
            serviceType: "cleaning",
            description: "Automated post-checkout cleaning request",
            priority: "high",
            status: "pending",
            assignedTo,
        });

        await newServiceRequest.save();
        return newServiceRequest.toJSON();
    }

    /**
     * Get service requests for the logged-in guest
     * @param {Object} currentUser - Current user making the request
     * @param {Object} filters - Optional filters (from, to)
     * @param {Object} pagination - Pagination options
     * @returns {Object} Paginated service requests
     */
    async getMyServiceRequests(currentUser, filters = {}, pagination = {}) {
        if (currentUser.role !== "guest") {
            throw new Error("This endpoint is only for guests");
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { requestedBy: currentUser.id };

        // Apply date range filter (filter by createdAt)
        if (filters.from || filters.to) {
            query.createdAt = {};
            if (filters.from) {
                const fromDate = new Date(filters.from);
                if (!isNaN(fromDate.getTime())) {
                    query.createdAt.$gte = fromDate;
                }
            }
            if (filters.to) {
                const toDate = new Date(filters.to);
                if (!isNaN(toDate.getTime())) {
                    query.createdAt.$lte = toDate;
                }
            }
            // If both dates are invalid, remove the createdAt filter
            if (Object.keys(query.createdAt).length === 0) {
                delete query.createdAt;
            }
        }

        // Get total count
        const totalRequests = await ServiceRequest.countDocuments(query);

        // Get paginated service requests
        const serviceRequests = await ServiceRequest.find(query)
            .populate("booking", "checkInDate checkOutDate status")
            .populate("room", "roomNumber roomType")
            .populate("requestedBy", "name email role")
            .populate("assignedTo", "name email role")
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
     * @param {Object} filters - Optional filters (status, serviceType, assignedRole, roomId, from, to)
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

        // Apply date range filter (filter by createdAt)
        if (filters.from || filters.to) {
            query.createdAt = {};
            if (filters.from) {
                const fromDate = new Date(filters.from);
                if (!isNaN(fromDate.getTime())) {
                    query.createdAt.$gte = fromDate;
                }
            }
            if (filters.to) {
                const toDate = new Date(filters.to);
                if (!isNaN(toDate.getTime())) {
                    query.createdAt.$lte = toDate;
                }
            }
            // If both dates are invalid, remove the createdAt filter
            if (Object.keys(query.createdAt).length === 0) {
                delete query.createdAt;
            }
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
            .populate("assignedTo", "name email role")
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
     * @param {Object} filters - Optional filters (from, to)
     * @param {Object} pagination - Pagination options
     * @returns {Object} Paginated service requests
     */
    async getAssignedServiceRequests(currentUser, filters = {}, pagination = {}) {
        // Only housekeeping staff can access this endpoint
        if (currentUser.role !== "housekeeping") {
            throw new Error("Access denied. Only housekeeping staff can access assigned tasks");
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        // Filter by assigned role AND assigned to current user
        const query = {
            assignedRole: "housekeeping",
            assignedTo: currentUser.id
        };

        // Apply date range filter (filter by createdAt)
        if (filters.from || filters.to) {
            query.createdAt = {};
            if (filters.from) {
                const fromDate = new Date(filters.from);
                if (!isNaN(fromDate.getTime())) {
                    query.createdAt.$gte = fromDate;
                }
            }
            if (filters.to) {
                const toDate = new Date(filters.to);
                if (!isNaN(toDate.getTime())) {
                    query.createdAt.$lte = toDate;
                }
            }
            // If both dates are invalid, remove the createdAt filter
            if (Object.keys(query.createdAt).length === 0) {
                delete query.createdAt;
            }
        }

        // Get total count
        const totalRequests = await ServiceRequest.countDocuments(query);

        // Get paginated service requests
        const serviceRequests = await ServiceRequest.find(query)
            .populate("booking", "checkInDate checkOutDate status")
            .populate("room", "roomNumber roomType")
            .populate("requestedBy", "name email role")
            .populate("assignedTo", "name email role")
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
     * Assign service request to a housekeeping staff member
     * @param {string} requestId - Service request ID
     * @param {string} staffId - Staff member ID to assign
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Updated service request
     */
    async assignServiceRequest(requestId, staffId, currentUser) {
        // Only admin can assign service requests
        if (currentUser.role !== "admin") {
            throw new Error("Access denied. Only admin can assign service requests");
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            throw new Error("Invalid service request ID");
        }
        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            throw new Error("Invalid staff ID");
        }

        // Find the service request and populate hotelId
        const serviceRequest = await ServiceRequest.findById(requestId)
            .populate("booking", "checkInDate checkOutDate status")
            .populate("room", "roomNumber roomType")
            .populate("requestedBy", "name email role")
            .populate("assignedTo", "name email role")
            .populate("hotelId", "name code");

        if (!serviceRequest) {
            throw new Error("Service request not found");
        }

        // Can only assign pending requests
        if (serviceRequest.status !== "pending") {
            throw new Error("Can only assign pending service requests");
        }

        // Verify staff member exists and has correct role
        const User = mongoose.model("User");
        const staffMember = await User.findById(staffId);

        if (!staffMember) {
            throw new Error("Staff member not found");
        }

        // Verify staff role matches request assigned role
        if (staffMember.role !== serviceRequest.assignedRole) {
            throw new Error(`Staff member must have ${serviceRequest.assignedRole} role`);
        }

        // Verify staff belongs to the same hotel as the service request
        if (serviceRequest.hotelId && staffMember.hotelId) {
            const requestHotelId = serviceRequest.hotelId._id || serviceRequest.hotelId;
            const staffHotelId = staffMember.hotelId._id || staffMember.hotelId;

            if (requestHotelId.toString() !== staffHotelId.toString()) {
                throw new Error("Cannot assign staff from a different hotel. Staff must belong to the same hotel as the service request");
            }
        }

        // Assign the request
        serviceRequest.assignedTo = staffId;
        await serviceRequest.save();

        // Re-populate after save
        await serviceRequest.populate("assignedTo", "name email role");

        return serviceRequest.toJSON();
    }

    /**
     * Update service request status
     * @param {string} requestId - Service request ID
     * @param {string} newStatus - New status
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Updated service request
     */
    async updateServiceRequestStatus(requestId, newStatus, currentUser, finalPrice) {
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
        const serviceRequest = await ServiceRequest.findById(requestId);

        if (!serviceRequest) {
            throw new Error("Service request not found");
        }

        // Authorization check
        if (currentUser.role === "housekeeping") {
            // Housekeeping can only update requests assigned to them
            if (serviceRequest.assignedRole !== "housekeeping") {
                throw new Error("Access denied. This task is not assigned to housekeeping");
            }

            // Housekeeping cannot self-assign - must be assigned by admin
            if (!serviceRequest.assignedTo || serviceRequest.assignedTo.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only update requests assigned to you");
            }
        } else if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            // Only housekeeping, admin and receptionist can update status
            throw new Error("Access denied. Unauthorized to update service request status");
        }

        // Update status
        serviceRequest.status = newStatus;

        if (newStatus === "completed") {
            serviceRequest.completedAt = new Date();
            if (finalPrice !== undefined) {
                serviceRequest.finalPrice = finalPrice;
            } else if (!serviceRequest.finalPrice && serviceRequest.fixedPrice) {
                serviceRequest.finalPrice = serviceRequest.fixedPrice;
            }
        }

        await serviceRequest.save();

        // Re-populate after save
        await serviceRequest.populate([
            { path: "booking", select: "checkInDate checkOutDate status" },
            { path: "room", select: "roomNumber roomType" },
            { path: "requestedBy", select: "name email role" },
            { path: "assignedTo", select: "name email role" }
        ]);

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
            .populate("requestedBy", "name email role")
            .populate("assignedTo", "name email role");

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
            // Must be assigned to current user
            if (!serviceRequest.assignedTo || serviceRequest.assignedTo._id.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only view requests assigned to you");
            }
        } else if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            throw new Error("Unauthorized to view service requests");
        }

        return serviceRequest.toJSON();
    }
}

export default new ServiceRequestService();

