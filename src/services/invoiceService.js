import Invoice from "../models/Invoice.js";
import Booking from "../models/Booking.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Room from "../models/Room.js";
import mongoose from "mongoose";

class InvoiceService {
    /**
     * Generate invoice for a booking
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Generated invoice
     */
    async generateInvoice(bookingId, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        // Check if invoice already exists for this booking
        const existingInvoice = await Invoice.findOne({ booking: bookingId });
        if (existingInvoice) {
            throw new Error("Invoice already exists for this booking");
        }

        // Get booking details
        const booking = await Booking.findById(bookingId)
            .populate("guest", "name email")
            .populate("room", "roomNumber roomType pricePerNight");

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Authorization check
        // - Admin and receptionist can generate invoice for any booking
        // - Guest can only generate invoice for their own booking
        if (currentUser.role === "guest") {
            if (booking.guest.toString() !== currentUser.id) {
                throw new Error("You can only generate invoices for your own bookings");
            }
        } else if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            throw new Error("Unauthorized to generate invoices");
        }

        // Booking must be checked-in to generate invoice
        if (!booking.isCheckedIn) {
            throw new Error("Cannot generate invoice for booking that is not checked-in");
        }

        // Calculate room charges
        const checkInDate = new Date(booking.checkInDate);
        const checkOutDate = new Date(booking.checkOutDate);
        const numberOfNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const totalRoomCharges = booking.room.pricePerNight * numberOfNights;

        // Get completed service requests for this booking
        const completedServices = await ServiceRequest.find({
            booking: bookingId,
            status: "completed",
        }).populate("room", "roomNumber roomType");

        // Calculate service charges
        const serviceCharges = completedServices.map((service) => ({
            serviceRequestId: service._id,
            serviceType: service.serviceType,
            description: service.description || "",
            price: service.finalPrice || service.fixedPrice || 0,
            completedAt: service.completedAt || service.updatedAt,
        }));

        const totalServiceCharges = serviceCharges.reduce((sum, service) => sum + service.price, 0);

        // Calculate totals
        const subtotal = totalRoomCharges + totalServiceCharges;
        const tax = subtotal * 0.1; // 10% tax
        const totalAmount = subtotal + tax;

        // Create invoice
        const invoiceData = {
            hotelId: booking.hotelId,
            booking: bookingId,
            roomCharges: {
                roomId: booking.room._id,
                roomNumber: booking.room.roomNumber,
                roomType: booking.room.roomType,
                pricePerNight: booking.room.pricePerNight,
                numberOfNights,
                totalRoomCharges,
            },
            serviceCharges,
            subtotal,
            tax,
            totalAmount,
            paymentStatus: "pending",
            paidAmount: 0,
            generatedBy: currentUser.id,
        };

        // Add guest or customer details
        if (booking.guest) {
            invoiceData.guest = booking.guest._id;
        } else if (booking.customerDetails) {
            invoiceData.customerDetails = booking.customerDetails;
        }

        const invoice = new Invoice(invoiceData);
        await invoice.save();

        // Populate references
        await invoice.populate([
            { path: "booking", select: "checkInDate checkOutDate status" },
            { path: "guest", select: "name email" },
            { path: "generatedBy", select: "name email role" },
        ]);

        return invoice.toJSON();
    }

    /**
     * Get invoice by booking ID
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Invoice
     */
    async getInvoiceByBookingId(bookingId, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        const invoice = await Invoice.findOne({ booking: bookingId })
            .populate("booking", "checkInDate checkOutDate status")
            .populate("guest", "name email")
            .populate("generatedBy", "name email role");

        if (!invoice) {
            throw new Error("Invoice not found for this booking");
        }

        // Authorization check
        if (currentUser.role === "guest") {
            // Guests can only view their own invoices
            if (!invoice.guest || invoice.guest._id.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only view your own invoices");
            }
        } else if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            throw new Error("Unauthorized to view invoices");
        }

        return invoice.toJSON();
    }

    /**
     * Update invoice payment status
     * @param {string} invoiceId - Invoice ID
     * @param {Object} paymentData - Payment data { paidAmount, paymentStatus }
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Updated invoice
     */
    async updatePaymentStatus(invoiceId, paymentData, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            throw new Error("Invalid invoice ID");
        }

        const invoice = await Invoice.findById(invoiceId).populate("guest", "_id");
        if (!invoice) {
            throw new Error("Invoice not found");
        }

        // Authorization check
        // - Admin and receptionist can update payment status for any invoice
        // - Guest can only update payment status for their own invoice
        if (currentUser.role === "guest") {
            if (!invoice.guest || invoice.guest._id.toString() !== currentUser.id) {
                throw new Error("You can only update payment status for your own invoices");
            }
        } else if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            throw new Error("Unauthorized to update payment status");
        }

        const { paidAmount, paymentStatus } = paymentData;

        // Validate payment amount
        if (paidAmount !== undefined) {
            if (paidAmount < 0) {
                throw new Error("Paid amount cannot be negative");
            }
            if (paidAmount > invoice.totalAmount) {
                throw new Error("Paid amount cannot exceed total amount");
            }
            invoice.paidAmount = paidAmount;
        }

        // Validate and update payment status
        if (paymentStatus) {
            const validStatuses = ["pending", "paid", "partially_paid"];
            if (!validStatuses.includes(paymentStatus)) {
                throw new Error(`Invalid payment status. Must be one of: ${validStatuses.join(", ")}`);
            }
            invoice.paymentStatus = paymentStatus;
        }

        // Auto-determine payment status based on paid amount
        if (invoice.paidAmount === 0) {
            invoice.paymentStatus = "pending";
        } else if (invoice.paidAmount >= invoice.totalAmount) {
            invoice.paymentStatus = "paid";
        } else {
            invoice.paymentStatus = "partially_paid";
        }

        await invoice.save();

        // Populate references
        await invoice.populate([
            { path: "booking", select: "checkInDate checkOutDate status" },
            { path: "guest", select: "name email" },
            { path: "generatedBy", select: "name email role" },
        ]);

        return invoice.toJSON();
    }

    /**
     * Get all invoices with filtering and pagination
     * @param {Object} filters - Optional filters (paymentStatus, from, to)
     * @param {Object} pagination - Pagination options
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Paginated invoices
     */
    async getAllInvoices(filters = {}, pagination = {}, currentUser) {
        // Only admin and receptionist can view all invoices
        if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            throw new Error("Only admin and receptionist can view all invoices");
        }

        const query = {};

        // Apply filters
        if (filters.paymentStatus) {
            query.paymentStatus = filters.paymentStatus;
        }

        // Apply date range filter
        if (filters.from || filters.to) {
            query.generatedAt = {};
            if (filters.from) {
                const fromDate = new Date(filters.from);
                if (!isNaN(fromDate.getTime())) {
                    query.generatedAt.$gte = fromDate;
                }
            }
            if (filters.to) {
                const toDate = new Date(filters.to);
                if (!isNaN(toDate.getTime())) {
                    query.generatedAt.$lte = toDate;
                }
            }
            if (Object.keys(query.generatedAt).length === 0) {
                delete query.generatedAt;
            }
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count
        const totalInvoices = await Invoice.countDocuments(query);

        // Get paginated invoices
        const invoices = await Invoice.find(query)
            .populate("booking", "checkInDate checkOutDate status")
            .populate("guest", "name email")
            .populate("generatedBy", "name email role")
            .sort({ generatedAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalInvoices / limit);

        return {
            invoices: invoices.map((invoice) => invoice.toJSON()),
            pagination: {
                totalInvoices,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }
}

export default new InvoiceService();
