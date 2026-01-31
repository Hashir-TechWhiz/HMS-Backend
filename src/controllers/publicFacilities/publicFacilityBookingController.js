import publicFacilityBookingService from "../../services/publicFacilityBookingService.js";

class PublicFacilityBookingController {
    /**
     * Check facility availability
     * GET /api/public-facility-bookings/check-availability
     * Query params: facilityId, startDate, endDate, startTime (optional), endTime (optional)
     * Public access
     */
    async checkAvailability(req, res, next) {
        try {
            const { facilityId, startDate, endDate, startTime, endTime } = req.query;

            if (!facilityId || !startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: "Facility ID, start date, and end date are required",
                });
            }

            const result = await publicFacilityBookingService.checkAvailability(
                facilityId,
                startDate,
                endDate,
                startTime,
                endTime
            );

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new facility booking
     * POST /api/public-facility-bookings
     * Authenticated users only
     */
    async createBooking(req, res, next) {
        try {
            const currentUser = req.user;
            const booking = await publicFacilityBookingService.createBooking(req.body, currentUser);

            res.status(201).json({
                success: true,
                message: "Booking created successfully",
                data: booking,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all bookings
     * GET /api/public-facility-bookings
     * Authenticated users only
     */
    async getAllBookings(req, res, next) {
        try {
            const currentUser = req.user;

            const filters = {
                status: req.query.status,
                facilityId: req.query.facilityId,
                guestId: req.query.guestId,
                from: req.query.from,
                to: req.query.to,
            };

            const pagination = {
                page: req.query.page,
                limit: req.query.limit,
            };

            const result = await publicFacilityBookingService.getAllBookings(filters, pagination, currentUser);

            res.status(200).json({
                success: true,
                count: result.bookings.length,
                pagination: result.pagination,
                data: result.bookings,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get booking by ID
     * GET /api/public-facility-bookings/:id
     * Authenticated users only
     */
    async getBookingById(req, res, next) {
        try {
            const currentUser = req.user;
            const booking = await publicFacilityBookingService.getBookingById(req.params.id, currentUser);

            res.status(200).json({
                success: true,
                data: booking,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cancel a booking
     * PATCH /api/public-facility-bookings/:id/cancel
     * Authenticated users only
     */
    async cancelBooking(req, res, next) {
        try {
            const currentUser = req.user;
            const penaltyData = req.body;

            const booking = await publicFacilityBookingService.cancelBooking(req.params.id, currentUser, penaltyData);

            res.status(200).json({
                success: true,
                message: "Booking cancelled successfully",
                data: booking,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Confirm a booking
     * PATCH /api/public-facility-bookings/:id/confirm
     * Receptionist and Admin only
     */
    async confirmBooking(req, res, next) {
        try {
            const currentUser = req.user;
            const booking = await publicFacilityBookingService.confirmBooking(req.params.id, currentUser);

            res.status(200).json({
                success: true,
                message: "Booking confirmed successfully",
                data: booking,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Check-in a booking
     * PATCH /api/public-facility-bookings/:id/check-in
     * Receptionist and Admin only
     */
    async checkInBooking(req, res, next) {
        try {
            const currentUser = req.user;
            const booking = await publicFacilityBookingService.checkInBooking(req.params.id, currentUser);

            res.status(200).json({
                success: true,
                message: "Booking checked-in successfully",
                data: booking,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Check-out a booking
     * PATCH /api/public-facility-bookings/:id/check-out
     * Receptionist and Admin only
     */
    async checkOutBooking(req, res, next) {
        try {
            const currentUser = req.user;
            const booking = await publicFacilityBookingService.checkOutBooking(req.params.id, currentUser);

            res.status(200).json({
                success: true,
                message: "Booking checked-out successfully",
                data: booking,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new PublicFacilityBookingController();
