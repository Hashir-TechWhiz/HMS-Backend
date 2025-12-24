import reportService from "../../services/reportService.js";

class ReportController {
    /**
     * Get booking summary report
     * GET /api/reports/bookings
     * Admin and Receptionist only
     */
    async getBookingSummary(req, res, next) {
        try {
            const summary = await reportService.getBookingSummary();

            res.status(200).json({
                success: true,
                data: summary,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get room overview report
     * GET /api/reports/rooms
     * Admin and Receptionist only
     */
    async getRoomOverview(req, res, next) {
        try {
            const overview = await reportService.getRoomOverview();

            res.status(200).json({
                success: true,
                data: overview,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get service request overview report
     * GET /api/reports/service-requests
     * Admin and Receptionist only
     */
    async getServiceRequestOverview(req, res, next) {
        try {
            const overview = await reportService.getServiceRequestOverview();

            res.status(200).json({
                success: true,
                data: overview,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all reports in a single call
     * GET /api/reports/overview
     * Admin and Receptionist only
     */
    async getAllReports(req, res, next) {
        try {
            const reports = await reportService.getAllReports();

            res.status(200).json({
                success: true,
                data: reports,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ReportController();

