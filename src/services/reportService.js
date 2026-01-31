import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import ServiceRequest from "../models/ServiceRequest.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import mongoose from "mongoose";

class ReportService {
    /**
     * Get booking summary report
     * Provides total bookings and breakdown by status
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Booking summary with totals and status breakdown
     */
    async getBookingSummary(currentUser) {
        // Build match stage for hotel filtering
        const matchStage = {};
        if (currentUser.role === "receptionist") {
            if (!currentUser.hotelId) {
                throw new Error("Receptionist must be assigned to a hotel");
            }
            matchStage.hotelId = new mongoose.Types.ObjectId(currentUser.hotelId);
        }
        // Admin sees all hotels (no filter)

        // Aggregation pipeline to get total and status breakdown
        const pipeline = [];
        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }
        pipeline.push({
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
        });

        const bookingSummary = await Booking.aggregate(pipeline);

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
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Room overview with totals and status breakdown
     */
    async getRoomOverview(currentUser) {
        // Build match stage for hotel filtering
        const matchStage = {};
        if (currentUser.role === "receptionist") {
            if (!currentUser.hotelId) {
                throw new Error("Receptionist must be assigned to a hotel");
            }
            matchStage.hotelId = new mongoose.Types.ObjectId(currentUser.hotelId);
        }
        // Admin sees all hotels (no filter)

        // Aggregation pipeline to get total and status breakdown
        const pipeline = [];
        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }
        pipeline.push({
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
        });

        const roomOverview = await Room.aggregate(pipeline);

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
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Service request overview with totals and breakdowns
     */
    async getServiceRequestOverview(currentUser) {
        // Build match stage for hotel filtering
        const matchStage = {};
        if (currentUser.role === "receptionist") {
            if (!currentUser.hotelId) {
                throw new Error("Receptionist must be assigned to a hotel");
            }
            matchStage.hotelId = new mongoose.Types.ObjectId(currentUser.hotelId);
        }
        // Admin sees all hotels (no filter)

        // Aggregation pipeline to get totals and breakdowns
        const pipeline = [];
        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }
        pipeline.push({
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
        });

        const serviceRequestOverview = await ServiceRequest.aggregate(pipeline);

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
    async getAllReports(currentUser) {
        // Execute all queries in parallel for better performance
        const [bookingSummary, roomOverview, serviceRequestOverview] = await Promise.all([
            this.getBookingSummary(currentUser),
            this.getRoomOverview(currentUser),
            this.getServiceRequestOverview(currentUser),
        ]);

        return {
            bookings: bookingSummary,
            rooms: roomOverview,
            serviceRequests: serviceRequestOverview,
        };
    }

    /**
     * Get detailed booking report with pagination
     * @param {Object} currentUser - Current user making the request
     * @param {Number} page - Page number (default: 1)
     * @param {Number} limit - Items per page (default: 10)
     * @param {Object} dateFilter - Optional date range filter { from, to }
     * @param {String} status - Optional status filter
     * @param {String} hotelId - Optional hotel ID filter (admin only)
     * @returns {Object} Paginated booking list with details
     */
    async getDetailedBookingReport(currentUser, page = 1, limit = 10, dateFilter = {}, status = null, hotelId = null) {
        const skip = (page - 1) * limit;

        // Build query with hotel filtering
        const query = {};
        if (currentUser.role === "receptionist") {
            if (!currentUser.hotelId) {
                throw new Error("Receptionist must be assigned to a hotel");
            }
            query.hotelId = currentUser.hotelId;
        } else if (currentUser.role === "admin" && hotelId) {
            // Admin can optionally filter by hotel
            query.hotelId = hotelId;
        }
        // Admin with no hotelId sees all hotels

        // Add date and status filters
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
     * @param {String} hotelId - Optional hotel ID filter (admin only)
     * @returns {Object} Paginated payment list
     */
    async getDetailedPaymentReport(currentUser, page = 1, limit = 10, dateFilter = {}, status = null, hotelId = null) {
        const skip = (page - 1) * limit;

        // Build query with hotel filtering and booking status
        const query = {
            status: { $in: ["confirmed", "checkedin", "completed"] },
        };

        // Add hotel filtering for receptionist
        if (currentUser.role === "receptionist") {
            if (!currentUser.hotelId) {
                throw new Error("Receptionist must be assigned to a hotel");
            }
            query.hotelId = currentUser.hotelId;
        } else if (currentUser.role === "admin" && hotelId) {
            // Admin can optionally filter by hotel
            query.hotelId = hotelId;
        }
        // Admin with no hotelId sees all hotels

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
     * @param {String} hotelId - Optional hotel ID filter (admin only)
     * @returns {Object} Paginated room utilization list
     */
    async getDetailedRoomReport(currentUser, page = 1, limit = 10, status = null, hotelId = null) {
        const skip = (page - 1) * limit;

        // Build query with hotel and status filters
        const matchQuery = {};
        if (currentUser.role === "receptionist") {
            if (!currentUser.hotelId) {
                throw new Error("Receptionist must be assigned to a hotel");
            }
            matchQuery.hotelId = new mongoose.Types.ObjectId(currentUser.hotelId);
        } else if (currentUser.role === "admin" && hotelId) {
            // Admin can optionally filter by hotel
            matchQuery.hotelId = new mongoose.Types.ObjectId(hotelId);
        }
        // Admin with no hotelId sees all hotels

        if (status) {
            matchQuery.status = status;
        }

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
     * @param {String} hotelId - Optional hotel ID filter (admin only)
     * @returns {Object} Paginated service request list
     */
    async getDetailedServiceRequestReport(currentUser, page = 1, limit = 10, dateFilter = {}, status = null, hotelId = null) {
        const skip = (page - 1) * limit;

        // Build query with hotel filtering
        const query = {};
        if (currentUser.role === "receptionist") {
            if (!currentUser.hotelId) {
                throw new Error("Receptionist must be assigned to a hotel");
            }
            query.hotelId = currentUser.hotelId;
        } else if (currentUser.role === "admin" && hotelId) {
            // Admin can optionally filter by hotel
            query.hotelId = hotelId;
        }
        // Admin with no hotelId sees all hotels

        // Add date and status filters
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
    async getDetailedGuestReport(currentUser, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        // Build aggregation pipeline with hotel filtering
        const pipeline = [
            { $match: { role: "guest" } },
            {
                $lookup: {
                    from: "bookings",
                    localField: "_id",
                    foreignField: "guest",
                    as: "bookings",
                },
            },
        ];

        // For receptionist, filter to only include guests who have bookings at their hotel
        if (currentUser.role === "receptionist") {
            if (!currentUser.hotelId) {
                throw new Error("Receptionist must be assigned to a hotel");
            }
            const hotelObjectId = new mongoose.Types.ObjectId(currentUser.hotelId);
            // Filter bookings array to only include bookings at receptionist's hotel
            pipeline.push({
                $addFields: {
                    bookings: {
                        $filter: {
                            input: "$bookings",
                            as: "booking",
                            cond: { $eq: ["$$booking.hotelId", hotelObjectId] }
                        }
                    }
                }
            });
            // Only include guests who have at least one booking at this hotel
            pipeline.push({
                $match: { "bookings.0": { $exists: true } }
            });
        }
        // Admin sees all guests (no filter)

        pipeline.push(
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
            { $limit: limit }
        );

        // Build count pipeline (same filters but for counting)
        const countPipeline = [
            { $match: { role: "guest" } },
            {
                $lookup: {
                    from: "bookings",
                    localField: "_id",
                    foreignField: "guest",
                    as: "bookings",
                },
            },
        ];

        if (currentUser.role === "receptionist") {
            const hotelObjectId = new mongoose.Types.ObjectId(currentUser.hotelId);
            countPipeline.push({
                $addFields: {
                    bookings: {
                        $filter: {
                            input: "$bookings",
                            as: "booking",
                            cond: { $eq: ["$$booking.hotelId", hotelObjectId] }
                        }
                    }
                }
            });
            countPipeline.push({
                $match: { "bookings.0": { $exists: true } }
            });
        }

        countPipeline.push({ $count: "total" });

        // Get guests with booking counts
        const [guests, countResult] = await Promise.all([
            User.aggregate(pipeline),
            User.aggregate(countPipeline),
        ]);

        const totalItems = countResult[0]?.total || 0;

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

    /**
     * Get detailed revenue report with pagination
     * Based on invoices with aggregated revenue data
     * @param {Object} currentUser - Current user making the request
     * @param {Number} page - Page number (default: 1)
     * @param {Number} limit - Items per page (default: 10)
     * @param {Object} dateFilter - Optional date range filter { from, to }
     * @param {String} paymentStatus - Optional payment status filter
     * @param {String} hotelId - Optional hotel ID filter (admin only)
     * @returns {Object} Paginated revenue report list
     */
    async getDetailedRevenueReport(currentUser, page = 1, limit = 10, dateFilter = {}, paymentStatus = null, hotelId = null) {
        const skip = (page - 1) * limit;

        // Build query with hotel filtering
        const query = {};

        // Add hotel filtering for receptionist
        if (currentUser.role === "receptionist") {
            if (!currentUser.hotelId) {
                throw new Error("Receptionist must be assigned to a hotel");
            }
            query.hotelId = new mongoose.Types.ObjectId(currentUser.hotelId);
        }

        // Add hotel filtering for admin (if hotelId is provided)
        if (currentUser.role === "admin" && hotelId) {
            query.hotelId = new mongoose.Types.ObjectId(hotelId);
        }

        // Add date filtering based on createdAt
        if (dateFilter.from || dateFilter.to) {
            query.createdAt = {};
            if (dateFilter.from) {
                query.createdAt.$gte = new Date(dateFilter.from);
            }
            if (dateFilter.to) {
                query.createdAt.$lte = new Date(dateFilter.to);
            }
        }

        // Add payment status filter
        if (paymentStatus && paymentStatus !== "all") {
            query.paymentStatus = paymentStatus;
        }

        // Get invoices with pagination
        const [invoices, totalItems] = await Promise.all([
            Invoice.find(query)
                .populate("booking", "checkInDate checkOutDate")
                .populate("guest", "name email")
                .populate("hotelId", "name code")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Invoice.countDocuments(query),
        ]);

        // Transform invoices to revenue records
        const revenueRecords = invoices.map((invoice) => {
            return {
                _id: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                hotelName: invoice.hotelDetails?.name || invoice.hotelId?.name || "N/A",
                hotelCode: invoice.hotelId?.code || "N/A",
                guestName: invoice.guestDetails?.name || "N/A",
                guestEmail: invoice.guestDetails?.email || "N/A",
                roomNumber: invoice.stayDetails?.roomNumber || "N/A",
                roomType: invoice.stayDetails?.roomType || "N/A",
                checkInDate: invoice.stayDetails?.checkInDate || null,
                checkOutDate: invoice.stayDetails?.checkOutDate || null,
                numberOfNights: invoice.stayDetails?.numberOfNights || 0,
                roomChargesTotal: invoice.summary?.roomChargesTotal || 0,
                serviceChargesTotal: invoice.summary?.serviceChargesTotal || 0,
                subtotal: invoice.summary?.subtotal || 0,
                tax: invoice.summary?.tax || 0,
                grandTotal: invoice.summary?.grandTotal || 0,
                paymentStatus: invoice.paymentStatus || "pending",
                createdAt: invoice.createdAt,
            };
        });

        // Calculate summary statistics for the current page
        const totalRevenue = revenueRecords.reduce((sum, record) => sum + (record.grandTotal || 0), 0);
        const totalRoomCharges = revenueRecords.reduce((sum, record) => sum + (record.roomChargesTotal || 0), 0);
        const totalServiceCharges = revenueRecords.reduce((sum, record) => sum + (record.serviceChargesTotal || 0), 0);
        const totalTax = revenueRecords.reduce((sum, record) => sum + (record.tax || 0), 0);

        return {
            items: revenueRecords,
            summary: {
                totalRevenue,
                totalRoomCharges,
                totalServiceCharges,
                totalTax,
                averageRevenuePerInvoice: revenueRecords.length > 0 ? totalRevenue / revenueRecords.length : 0,
            },
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

