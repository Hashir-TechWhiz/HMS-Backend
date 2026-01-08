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

    /**
     * Get detailed booking report with pagination
     * GET /api/reports/bookings/detailed
     * Query params: page, limit, from, to, status
     * Admin and Receptionist only
     */
    async getDetailedBookingReport(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const dateFilter = {
                from: req.query.from || undefined,
                to: req.query.to || undefined,
            };
            const status = req.query.status || null;

            const report = await reportService.getDetailedBookingReport(page, limit, dateFilter, status);

            res.status(200).json({
                success: true,
                data: report,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get detailed payment report with pagination
     * GET /api/reports/payments/detailed
     * Query params: page, limit, from, to, status
     * Admin and Receptionist only
     */
    async getDetailedPaymentReport(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const dateFilter = {
                from: req.query.from || undefined,
                to: req.query.to || undefined,
            };
            const status = req.query.status || null;

            const report = await reportService.getDetailedPaymentReport(page, limit, dateFilter, status);

            res.status(200).json({
                success: true,
                data: report,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get detailed room utilization report with pagination
     * GET /api/reports/rooms/detailed
     * Query params: page, limit, status
     * Admin and Receptionist only
     */
    async getDetailedRoomReport(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status || null;

            const report = await reportService.getDetailedRoomReport(page, limit, status);

            res.status(200).json({
                success: true,
                data: report,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get detailed service request report with pagination
     * GET /api/reports/service-requests/detailed
     * Query params: page, limit, from, to, status
     * Admin and Receptionist only
     */
    async getDetailedServiceRequestReport(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const dateFilter = {
                from: req.query.from || undefined,
                to: req.query.to || undefined,
            };
            const status = req.query.status || null;

            const report = await reportService.getDetailedServiceRequestReport(page, limit, dateFilter, status);

            res.status(200).json({
                success: true,
                data: report,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get detailed guest report with pagination
     * GET /api/reports/guests/detailed
     * Query params: page, limit
     * Admin and Receptionist only
     */
    async getDetailedGuestReport(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const report = await reportService.getDetailedGuestReport(page, limit);

            res.status(200).json({
                success: true,
                data: report,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ReportController();

