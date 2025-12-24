import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import ServiceRequest from "../models/ServiceRequest.js";

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
            cancelled: 0,
        };

        // Populate status map with actual counts
        statusBreakdown.forEach((item) => {
            statusMap[item.status] = item.count;
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
}

export default new ReportService();

