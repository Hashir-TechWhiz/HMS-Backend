import paymentService from "../../services/paymentService.js";

/**
 * Add payment to a booking
 * @route POST /api/payments/bookings/:bookingId/payments
 * @access Private (Guest, Receptionist, Admin)
 */
export const addPayment = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const paymentData = req.body;
        const currentUser = req.user;

        const booking = await paymentService.addPayment(bookingId, paymentData, currentUser);

        res.status(201).json({
            success: true,
            message: "Payment added successfully",
            data: booking,
        });
    } catch (error) {
        console.error("Error adding payment:", error.message);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to add payment",
        });
    }
};

/**
 * Get all payments for a booking
 * @route GET /api/payments/bookings/:bookingId/payments
 * @access Private (Guest, Receptionist, Admin)
 */
export const getBookingPayments = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const currentUser = req.user;

        const payments = await paymentService.getBookingPayments(bookingId, currentUser);

        res.status(200).json({
            success: true,
            data: payments,
        });
    } catch (error) {
        console.error("Error getting booking payments:", error.message);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to get booking payments",
        });
    }
};

/**
 * Get all payments for current user's bookings (guest only)
 * @route GET /api/payments/my-payments
 * @access Private (Guest only)
 */
export const getMyPayments = async (req, res) => {
    try {
        const currentUser = req.user;
        const pagination = {
            page: req.query.page,
            limit: req.query.limit,
        };

        const payments = await paymentService.getMyPayments(currentUser, pagination);

        res.status(200).json({
            success: true,
            data: payments,
        });
    } catch (error) {
        console.error("Error getting my payments:", error.message);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to get payments",
        });
    }
};

/**
 * Get balance for a booking
 * @route GET /api/payments/bookings/:bookingId/balance
 * @access Private (Guest, Receptionist, Admin)
 */
export const getBookingBalance = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const currentUser = req.user;

        const balance = await paymentService.getBookingBalance(bookingId, currentUser);

        res.status(200).json({
            success: true,
            data: balance,
        });
    } catch (error) {
        console.error("Error getting booking balance:", error.message);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to get booking balance",
        });
    }
};

/**
 * Get all payments (admin/receptionist only)
 * @route GET /api/payments
 * @access Private (Admin, Receptionist)
 */
export const getAllPayments = async (req, res) => {
    try {
        const currentUser = req.user;
        const filters = {
            hotelId: req.query.hotelId,
            paymentStatus: req.query.paymentStatus,
            from: req.query.from,
            to: req.query.to,
        };
        const pagination = {
            page: req.query.page,
            limit: req.query.limit,
        };

        const payments = await paymentService.getAllPayments(filters, pagination, currentUser);

        res.status(200).json({
            success: true,
            data: payments,
        });
    } catch (error) {
        console.error("Error getting all payments:", error.message);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to get payments",
        });
    }
};
