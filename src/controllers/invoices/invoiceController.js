import invoiceService from "../../services/invoiceService.js";

class InvoiceController {
    /**
     * Get invoice by booking ID
     * GET /api/invoices/booking/:bookingId
     */
    async getInvoiceByBookingId(req, res, next) {
        try {
            const { bookingId } = req.params;
            const currentUser = req.user;

            const invoice = await invoiceService.getInvoiceByBookingId(bookingId, currentUser);

            res.status(200).json({
                success: true,
                data: invoice,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get invoice by invoice number
     * GET /api/invoices/:invoiceNumber
     */
    async getInvoiceByNumber(req, res, next) {
        try {
            const { invoiceNumber } = req.params;
            const currentUser = req.user;

            const invoice = await invoiceService.getInvoiceByNumber(invoiceNumber, currentUser);

            res.status(200).json({
                success: true,
                data: invoice,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Download invoice PDF
     * GET /api/invoices/:invoiceId/download
     */
    async downloadInvoicePDF(req, res, next) {
        try {
            const { invoiceId } = req.params;
            const currentUser = req.user;

            const pdfBuffer = await invoiceService.downloadInvoicePDF(invoiceId, currentUser);

            // Get invoice for filename
            const invoice = await invoiceService.getInvoiceByNumber(invoiceId, currentUser);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);
            res.send(pdfBuffer);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Resend invoice email
     * POST /api/invoices/:invoiceId/resend
     */
    async resendInvoiceEmail(req, res, next) {
        try {
            const { invoiceId } = req.params;
            const currentUser = req.user;

            // Only admin and receptionist can resend invoices
            if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Only admin and receptionist can resend invoices",
                });
            }

            const invoice = await invoiceService.generateAndEmailInvoicePDF(invoiceId);

            res.status(200).json({
                success: true,
                message: "Invoice email sent successfully",
                data: invoice,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all invoices (admin/receptionist only)
     * GET /api/invoices
     */
    async getAllInvoices(req, res, next) {
        try {
            const currentUser = req.user;
            const { hotelId, paymentStatus, from, to, page, limit } = req.query;

            const filters = {
                hotelId,
                paymentStatus,
                from,
                to,
            };

            const pagination = {
                page: page || 1,
                limit: limit || 10,
            };

            const result = await invoiceService.getAllInvoices(filters, pagination, currentUser);

            res.status(200).json({
                success: true,
                data: result.invoices,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update invoice payment status (admin/receptionist only)
     * PATCH /api/invoices/:invoiceId/payment-status
     */
    async updatePaymentStatus(req, res, next) {
        try {
            const { invoiceId } = req.params;
            const currentUser = req.user;
            const paymentData = req.body;

            const invoice = await invoiceService.updatePaymentStatus(invoiceId, paymentData, currentUser);

            res.status(200).json({
                success: true,
                message: "Payment status updated successfully",
                data: invoice,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Generate invoice manually (admin/receptionist only)
     * POST /api/invoices/generate/:bookingId
     */
    async generateInvoice(req, res, next) {
        try {
            const { bookingId } = req.params;
            const currentUser = req.user;

            // Only admin and receptionist can manually generate invoices
            if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Only admin and receptionist can generate invoices",
                });
            }

            const invoice = await invoiceService.generateInvoice(bookingId, currentUser);

            // Optionally email the invoice
            if (req.body.sendEmail !== false) {
                try {
                    await invoiceService.generateAndEmailInvoicePDF(invoice._id);
                } catch (emailError) {
                    console.error("Failed to email invoice:", emailError.message);
                }
            }

            res.status(201).json({
                success: true,
                message: "Invoice generated successfully",
                data: invoice,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new InvoiceController();
