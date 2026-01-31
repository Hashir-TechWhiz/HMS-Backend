import express from "express";
import {
    addPayment,
    getBookingPayments,
    getMyPayments,
    getBookingBalance,
    getAllPayments,
    getFacilityBookingPayments,
    getFacilityBookingBalance,
} from "../controllers/payments/paymentController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Room booking payment routes
router.post("/bookings/:bookingId/payments", addPayment);
router.get("/bookings/:bookingId/payments", getBookingPayments);
router.get("/bookings/:bookingId/balance", getBookingBalance);

// Facility booking payment routes
router.get("/facility-bookings/:bookingId/payments", getFacilityBookingPayments);
router.get("/facility-bookings/:bookingId/balance", getFacilityBookingBalance);

// Get all payments for current user's bookings (guest only)
router.get("/my-payments", authorize("guest"), getMyPayments);

// Get all payments (admin/receptionist only)
router.get("/", authorize("admin", "receptionist"), getAllPayments);

export default router;
