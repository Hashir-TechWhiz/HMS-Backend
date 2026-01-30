import express from "express";
import {
    addPayment,
    getBookingPayments,
    getMyPayments,
    getBookingBalance,
    getAllPayments,
} from "../controllers/payments/paymentController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Add payment to a booking
router.post("/bookings/:bookingId/payments", addPayment);

// Get all payments for a booking
router.get("/bookings/:bookingId/payments", getBookingPayments);

// Get balance for a booking
router.get("/bookings/:bookingId/balance", getBookingBalance);

// Get all payments for current user's bookings (guest only)
router.get("/my-payments", authorize("guest"), getMyPayments);

// Get all payments (admin/receptionist only)
router.get("/", authorize("admin", "receptionist"), getAllPayments);

export default router;
