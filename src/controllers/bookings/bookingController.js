import bookingService from "../../services/bookingService.js";

class BookingController {
    /**
     * Create a new booking
     * POST /api/bookings
     * Authenticated users only
     * Guests book for themselves, receptionist/admin can book for any guest
     */
    async createBooking(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware

            const booking = await bookingService.createBooking(req.body, currentUser);

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
     * GET /api/bookings
     * Authenticated users only
     * Guests see only their bookings, receptionist/admin see all
     * Query params: status, guestId, roomId, from, to, page, limit
     */
    async getAllBookings(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware

            const filters = {
                status: req.query.status,
                guestId: req.query.guestId,
                roomId: req.query.roomId,
                from: req.query.from,
                to: req.query.to,
            };

            const pagination = {
                page: req.query.page,
                limit: req.query.limit,
            };

            const result = await bookingService.getAllBookings(filters, pagination, currentUser);

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
     * Get bookings for the current logged-in user (guest)
     * GET /api/bookings/my-bookings
     * Guest users only
     * Query params: from, to, page, limit
     */
    async getMyBookings(req, res, next) {
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

            const result = await bookingService.getMyBookings(currentUser, filters, pagination);

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
     * Get a single booking by ID
     * GET /api/bookings/:id
     * Authenticated users only
     * Guests can only view their own bookings
     */
    async getBookingById(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware

            const booking = await bookingService.getBookingById(req.params.id, currentUser);

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
     * PATCH /api/bookings/:id/cancel
     * Authenticated users only
     * Guests can only cancel their own bookings
     * Receptionist and admin can cancel any booking with optional penalty data
     */
    async cancelBooking(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware
            const penaltyData = req.body; // Optional penalty data from request body

            const booking = await bookingService.cancelBooking(req.params.id, currentUser, penaltyData);

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
     * PATCH /api/bookings/:id/confirm
     * Receptionist and Admin only
     */
    async confirmBooking(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware

            const booking = await bookingService.confirmBooking(req.params.id, currentUser);

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
         * Update check-in status
         * PATCH /api/bookings/:id/checkin
         * Receptionist and Admin only
         * Precondition: check-in should be today, checkout status is completed
         */
        async updateCheckInStatus(req, res, next) {
            try {
                const currentUser = req.user;
                const booking = await bookingService.updateCheckInStatus(req.params.id, currentUser);
                res.status(200).json({
                    success: true,
                    message: "Check-in updated successfully",
                    data: booking,
                });
            } catch (error) {
                next(error);
            }
        }

    /**
     * Edit a booking
     * PUT /api/bookings/:id
     * Receptionist/Admin only
     * Cannot change customer
     */
    async editBooking(req, res, next) {
        try {
            const currentUser = req.user;
            const booking = await bookingService.editBooking(req.params.id, req.body, currentUser);
            res.status(200).json({
                success: true,
                message: "Booking updated successfully",
                data: booking,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get available rooms for given check-in and check-out dates
     * GET /api/rooms/available
     * Authenticated users only
     */
    async getAvailableRooms(req, res, next) {
        try {
            const { checkInDate, checkOutDate } = req.query;
            const rooms = await bookingService.getAvailableRooms(checkInDate, checkOutDate);
            res.status(200).json({
                success: true,
                data: rooms,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new BookingController();

