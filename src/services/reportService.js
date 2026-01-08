import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import ServiceRequest from "../models/ServiceRequest.js";
import User from "../models/User.js";

class ReportService {
    /**
     * Get booking summary report
     * Provides total bookings and breakdown by status
     * @returns {Object} Booking summary with totals and status breakdown
     */
    async getBookingSummary() {
        // Aggregation pipeline to get total and status breakdown
        const bookingSummary = await Booking.aggregate([
            {
                $facet: {
                    // Get total count
                    totalCount: [{ $count: "total" }],
                    // Get count by status
                    byStatus: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                status: "$_id",
                                count: 1,
                            },
                        },
                        {
                            $sort: { status: 1 },
                        },
                    ],
                },
            },
        ]);

        // Extract results
        const totalBookings = bookingSummary[0]?.totalCount[0]?.total || 0;
        const statusBreakdown = bookingSummary[0]?.byStatus || [];

        // Create a map for easy access and ensure all statuses are represented
        const statusMap = {
            pending: 0,
            confirmed: 0,
            checkedin: 0,
            completed: 0,
            cancelled: 0,
        };

        // Populate status map with actual counts
        statusBreakdown.forEach((item) => {
            if (statusMap.hasOwnProperty(item.status)) {
                statusMap[item.status] = item.count;
            }
        });

        return {
            totalBookings,
            byStatus: statusMap,
        };
    }

    /**
     * Get room overview report
     * Provides total rooms and breakdown by status
     * @returns {Object} Room overview with totals and status breakdown
     */
    async getRoomOverview() {
        // Aggregation pipeline to get total and status breakdown
        const roomOverview = await Room.aggregate([
            {
                $facet: {
                    // Get total count
                    totalCount: [{ $count: "total" }],
                    // Get count by status
                    byStatus: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                status: "$_id",
                                count: 1,
                            },
                        },
                        {
                            $sort: { status: 1 },
                        },
                    ],
                },
            },
        ]);

        // Extract results
        const totalRooms = roomOverview[0]?.totalCount[0]?.total || 0;
        const statusBreakdown = roomOverview[0]?.byStatus || [];

        // Create a map for easy access and ensure all statuses are represented
        const statusMap = {
            available: 0,
            unavailable: 0,
            maintenance: 0,
        };

        // Populate status map with actual counts
        statusBreakdown.forEach((item) => {
            statusMap[item.status] = item.count;
        });

        return {
            totalRooms,
            byStatus: statusMap,
        };
    }

    /**
     * Get service request overview report
     * Provides total service requests, breakdown by status, and breakdown by assigned role
     * @returns {Object} Service request overview with totals and breakdowns
     */
    async getServiceRequestOverview() {
        // Aggregation pipeline to get totals and breakdowns
        const serviceRequestOverview = await ServiceRequest.aggregate([
            {
                $facet: {
                    // Get total count
                    totalCount: [{ $count: "total" }],
                    // Get count by status
                    byStatus: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                status: "$_id",
                                count: 1,
                            },
                        },
                        {
                            $sort: { status: 1 },
                        },
                    ],
                    // Get count by assigned role
                    byAssignedRole: [
                        {
                            $group: {
                                _id: "$assignedRole",
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                assignedRole: "$_id",
                                count: 1,
                            },
                        },
                        {
                            $sort: { assignedRole: 1 },
                        },
                    ],
                },
            },
        ]);

        // Extract results
        const totalServiceRequests = serviceRequestOverview[0]?.totalCount[0]?.total || 0;
        const statusBreakdown = serviceRequestOverview[0]?.byStatus || [];
        const assignedRoleBreakdown = serviceRequestOverview[0]?.byAssignedRole || [];

        // Create status map and ensure all statuses are represented
        const statusMap = {
            pending: 0,
            in_progress: 0,
            completed: 0,
        };

        // Populate status map with actual counts
        statusBreakdown.forEach((item) => {
            statusMap[item.status] = item.count;
        });

        // Create assigned role map and ensure all roles are represented
        const assignedRoleMap = {
            housekeeping: 0,
            maintenance: 0,
        };

        // Populate assigned role map with actual counts
        assignedRoleBreakdown.forEach((item) => {
            if (item.assignedRole) {
                assignedRoleMap[item.assignedRole] = item.count;
            }
        });

        return {
            totalServiceRequests,
            byStatus: statusMap,
            byAssignedRole: assignedRoleMap,
        };
    }

    /**
     * Get all reports in a single call
     * Provides comprehensive overview of all system entities
     * @returns {Object} Complete report with bookings, rooms, and service requests
     */
    async getAllReports() {
        // Execute all queries in parallel for better performance
        const [bookingSummary, roomOverview, serviceRequestOverview] = await Promise.all([
            this.getBookingSummary(),
            this.getRoomOverview(),
            this.getServiceRequestOverview(),
        ]);

        return {
            bookings: bookingSummary,
            rooms: roomOverview,
            serviceRequests: serviceRequestOverview,
        };
    }

    /**
     * Get detailed booking report with pagination
     * @param {Number} page - Page number (default: 1)
     * @param {Number} limit - Items per page (default: 10)
     * @param {Object} dateFilter - Optional date range filter { from, to }
     * @param {String} status - Optional status filter
     * @returns {Object} Paginated booking list with details
     */
    async getDetailedBookingReport(page = 1, limit = 10, dateFilter = {}, status = null) {
        const skip = (page - 1) * limit;

        // Build query with date and status filters
        const query = {};
        if (dateFilter.from || dateFilter.to) {
            query.createdAt = {};
            if (dateFilter.from) {
                query.createdAt.$gte = new Date(dateFilter.from);
            }
            if (dateFilter.to) {
                query.createdAt.$lte = new Date(dateFilter.to);
            }
        }
        if (status) {
            query.status = status;
        }

        // Get bookings with populated data
        const [bookings, totalItems] = await Promise.all([
            Booking.find(query)
                .populate("guest", "name email")
                .populate("room", "roomNumber roomType")
                .populate("createdBy", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Booking.countDocuments(query),
        ]);

        return {
            items: bookings,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit,
            },
        };
    }

    /**
     * Get detailed payment report with pagination
     * Based on confirmed/completed bookings (dummy payment data)
     * @param {Number} page - Page number (default: 1)
     * @param {Number} limit - Items per page (default: 10)
     * @param {Object} dateFilter - Optional date range filter { from, to }
     * @param {String} status - Optional payment status filter (for UI purposes, all are "Completed")
     * @returns {Object} Paginated payment list
     */
    async getDetailedPaymentReport(page = 1, limit = 10, dateFilter = {}, status = null) {
        const skip = (page - 1) * limit;

        // Build query with booking status and date filter
        const query = {
            status: { $in: ["confirmed", "checkedin", "completed"] },
        };

        if (dateFilter.from || dateFilter.to) {
            query.createdAt = {};
            if (dateFilter.from) {
                query.createdAt.$gte = new Date(dateFilter.from);
            }
            if (dateFilter.to) {
                query.createdAt.$lte = new Date(dateFilter.to);
            }
        }
        // Note: Status filter for payments is primarily for UI consistency
        // All payment records show "Completed" status

        // Get bookings that have payments (confirmed/completed status)
        const [bookings, totalItems] = await Promise.all([
            Booking.find(query)
                .populate("guest", "name email")
                .populate("room", "roomNumber pricePerNight")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Booking.countDocuments(query),
        ]);

        // Transform bookings to payment records
        const payments = bookings.map((booking) => {
            // Calculate total amount
            const checkIn = new Date(booking.checkInDate);
            const checkOut = new Date(booking.checkOutDate);
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            const pricePerNight = booking.room?.pricePerNight || 0;
            const totalAmount = nights * pricePerNight;

            // Determine guest/customer name
            let guestName = "Walk-in Customer";
            if (booking.guest?.name) {
                guestName = booking.guest.name;
            } else if (booking.customerDetails?.name) {
                guestName = booking.customerDetails.name;
            }

            return {
                _id: booking._id,
                bookingId: booking._id,
                guestName,
                amount: totalAmount,
                paymentMethod: "Card", // Dummy data - all payments via card
                paymentStatus: "Completed",
                createdAt: booking.createdAt,
            };
        });

        return {
            items: payments,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit,
            },
        };
    }

    /**
     * Get detailed room utilization report with pagination
     * @param {Number} page - Page number (default: 1)
     * @param {Number} limit - Items per page (default: 10)
     * @param {String} status - Optional room status filter
     * @returns {Object} Paginated room utilization list
     */
    async getDetailedRoomReport(page = 1, limit = 10, status = null) {
        const skip = (page - 1) * limit;

        // Build query with status filter
        const matchQuery = status ? { status } : {};

        // Get rooms with booking counts
        const [rooms, totalItems] = await Promise.all([
            Room.aggregate([
                { $match: matchQuery },
                {
                    $lookup: {
                        from: "bookings",
                        localField: "_id",
                        foreignField: "room",
                        as: "bookings",
                    },
                },
                {
                    $project: {
                        roomNumber: 1,
                        roomType: 1,
                        status: 1,
                        totalBookings: { $size: "$bookings" },
                    },
                },
                { $sort: { roomNumber: 1 } },
                { $skip: skip },
                { $limit: limit },
            ]),
            Room.countDocuments(matchQuery),
        ]);

        return {
            items: rooms,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit,
            },
        };
    }

    /**
     * Get detailed service request report with pagination
     * @param {Number} page - Page number (default: 1)
     * @param {Number} limit - Items per page (default: 10)
     * @param {Object} dateFilter - Optional date range filter { from, to }
     * @param {String} status - Optional status filter
     * @returns {Object} Paginated service request list
     */
    async getDetailedServiceRequestReport(page = 1, limit = 10, dateFilter = {}, status = null) {
        const skip = (page - 1) * limit;

        // Build query with date and status filters
        const query = {};
        if (dateFilter.from || dateFilter.to) {
            query.createdAt = {};
            if (dateFilter.from) {
                query.createdAt.$gte = new Date(dateFilter.from);
            }
            if (dateFilter.to) {
                query.createdAt.$lte = new Date(dateFilter.to);
            }
        }
        if (status) {
            query.status = status;
        }

        // Get service requests with populated data
        const [serviceRequests, totalItems] = await Promise.all([
            ServiceRequest.find(query)
                .populate("assignedTo", "name")
                .populate("room", "roomNumber")
                .populate("requestedBy", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ServiceRequest.countDocuments(query),
        ]);

        return {
            items: serviceRequests,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit,
            },
        };
    }

    /**
     * Get guest report with pagination
     * @param {Number} page - Page number (default: 1)
     * @param {Number} limit - Items per page (default: 10)
     * @returns {Object} Paginated guest list with booking counts
     */
    async getDetailedGuestReport(page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        // Get all guests with booking counts
        const [guests, totalItems] = await Promise.all([
            User.aggregate([
                { $match: { role: "guest" } },
                {
                    $lookup: {
                        from: "bookings",
                        localField: "_id",
                        foreignField: "guest",
                        as: "bookings",
                    },
                },
                {
                    $project: {
                        name: 1,
                        email: 1,
                        isActive: 1,
                        totalBookings: { $size: "$bookings" },
                        createdAt: 1,
                    },
                },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
            ]),
            User.countDocuments({ role: "guest" }),
        ]);

        return {
            items: guests,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit,
            },
        };
    }
}

export default new ReportService();

