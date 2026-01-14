import express from "express";
import invoiceController from "../controllers/invoices/invoiceController.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

// All invoice routes require authentication
router.use(authenticate);

// Get all invoices (admin/receptionist only)
router.get("/", invoiceController.getAllInvoices);

// Generate invoice manually (admin/receptionist only)
router.post("/generate/:bookingId", invoiceController.generateInvoice);

// Get invoice by booking ID
router.get("/booking/:bookingId", invoiceController.getInvoiceByBookingId);

// Get invoice by invoice number
router.get("/:invoiceNumber", invoiceController.getInvoiceByNumber);

// Download invoice PDF
router.get("/:invoiceId/download", invoiceController.downloadInvoicePDF);

// Resend invoice email (admin/receptionist only)
router.post("/:invoiceId/resend", invoiceController.resendInvoiceEmail);

// Update payment status (admin/receptionist only)
router.patch("/:invoiceId/payment-status", invoiceController.updatePaymentStatus);

export default router;
