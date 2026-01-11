import express from "express";
import invoiceController from "../controllers/invoices/invoiceController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/**
 * @route   POST /api/invoices/generate/:bookingId
 * @desc    Generate invoice for a booking
 * @access  Private (Receptionist, Admin)
 */
router.post(
    "/generate/:bookingId",
    authenticate,
    authorize("receptionist", "admin"),
    invoiceController.generateInvoice
);

/**
 * @route   GET /api/invoices/booking/:bookingId
 * @desc    Get invoice by booking ID
 * @access  Private (Guest, Receptionist, Admin)
 */
router.get(
    "/booking/:bookingId",
    authenticate,
    authorize("guest", "receptionist", "admin"),
    invoiceController.getInvoiceByBookingId
);

/**
 * @route   PATCH /api/invoices/:id/payment
 * @desc    Update invoice payment status
 * @access  Private (Receptionist, Admin)
 */
router.patch(
    "/:id/payment",
    authenticate,
    authorize("receptionist", "admin"),
    invoiceController.updatePaymentStatus
);

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices
 * @access  Private (Receptionist, Admin)
 */
router.get(
    "/",
    authenticate,
    authorize("receptionist", "admin"),
    invoiceController.getAllInvoices
);

export default router;
