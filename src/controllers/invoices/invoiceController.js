import invoiceService from "../../services/invoiceService.js";

class InvoiceController {
    /**
     * Generate invoice for a booking
     * POST /api/invoices/generate/:bookingId
     */
    async generateInvoice(req, res, next) {
        try {
            const { bookingId } = req.params;
            const currentUser = req.user;

            const invoice = await invoiceService.generateInvoice(bookingId, currentUser);

            res.status(201).json({
                success: true,
                message: "Invoice generated successfully",
                data: invoice,
            });
        } catch (error) {
            next(error);
        }
    }

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
     * Update invoice payment status
     * PATCH /api/invoices/:id/payment
     */
    async updatePaymentStatus(req, res, next) {
        try {
            const { id } = req.params;
            const paymentData = req.body;
            const currentUser = req.user;

            const invoice = await invoiceService.updatePaymentStatus(id, paymentData, currentUser);

            res.status(200).json({
                success: true,
                message: "Invoice payment status updated successfully",
                data: invoice,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all invoices
     * GET /api/invoices
     */
    async getAllInvoices(req, res, next) {
        try {
            const currentUser = req.user;
            const filters = {
                paymentStatus: req.query.paymentStatus,
                from: req.query.from,
                to: req.query.to,
            };
            const pagination = {
                page: req.query.page,
                limit: req.query.limit,
            };

            const result = await invoiceService.getAllInvoices(filters, pagination, currentUser);

            res.status(200).json({
                success: true,
                count: result.invoices.length,
                pagination: result.pagination,
                data: result.invoices,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new InvoiceController();
