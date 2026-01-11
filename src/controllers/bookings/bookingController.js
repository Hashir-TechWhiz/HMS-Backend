import bookingService from "../../services/bookingService.js";

class BookingController {
    /**
     * Check room availability
     * GET /api/bookings/check-availability
     * Query params: roomId, checkInDate, checkOutDate
     * Public access (no authentication required for checking)
     */
    async checkAvailability(req, res, next) {
        try {
            const { roomId, checkInDate, checkOutDate } = req.query;

            if (!roomId || !checkInDate || !checkOutDate) {
                return res.status(400).json({
                    success: false,
                    message: "Room ID, check-in date, and check-out date are required",
                });
            }

            const result = await bookingService.checkAvailability(roomId, checkInDate, checkOutDate);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

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
     * Check-in a booking
     * PATCH /api/bookings/:id/check-in
     * Receptionist and Admin only
     */
    async checkInBooking(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware
            const checkInData = req.body;

            const booking = await bookingService.checkInBooking(req.params.id, checkInData, currentUser);

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
     * PATCH /api/bookings/:id/check-out
     * Receptionist and Admin only
     */
    async checkOutBooking(req, res, next) {
        try {
            const currentUser = req.user; // Set by authenticate middleware

            const booking = await bookingService.checkOutBooking(req.params.id, currentUser);

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

export default new BookingController();

