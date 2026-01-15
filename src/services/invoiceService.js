import Invoice from "../models/Invoice.js";
import Booking from "../models/Booking.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import Room from "../models/Room.js";
import mongoose from "mongoose";
import transporter from "../config/nodemailer.js";
import { invoiceEmailTemplate } from "../templates/invoiceEmailTemplate.js";
import { generateInvoicePDF } from "../utils/pdfGenerator.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class InvoiceService {
    /**
     * Generate invoice for a completed booking
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - User generating the invoice
     * @returns {Object} Generated invoice
     */
    async generateInvoice(bookingId, currentUser) {
        // Validate booking ID
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        // Fetch booking with all necessary details
        const booking = await Booking.findById(bookingId)
            .populate("room")
            .populate("guest")
            .populate("hotelId");

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Check if booking is checked-in (Option A: Invoice generated DURING checkout, not after)
        if (booking.status !== "checkedin") {
            if (booking.status === "completed") {
                throw new Error("Invoice has already been generated for this booking");
            } else if (booking.status === "confirmed") {
                throw new Error("Cannot generate invoice. Booking must be checked-in first");
            } else {
                throw new Error(`Cannot generate invoice for bookings with status: ${booking.status}`);
            }
        }

        // Check if invoice already exists for this booking
        const existingInvoice = await Invoice.findOne({ booking: bookingId });
        if (existingInvoice) {
            throw new Error("Invoice already exists for this booking");
        }

        // Get hotel details
        const hotel = booking.hotelId;
        if (!hotel) {
            throw new Error("Hotel information not found");
        }

        // Get room details
        const room = booking.room;
        if (!room) {
            throw new Error("Room information not found");
        }

        // Calculate number of nights
        const checkInDate = new Date(booking.checkInDate);
        const checkOutDate = new Date(booking.checkOutDate);
        const numberOfNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        // Calculate room charges
        const roomCharges = {
            pricePerNight: room.pricePerNight,
            numberOfNights: numberOfNights,
            subtotal: room.pricePerNight * numberOfNights,
        };

        // Fetch all completed service requests for this booking
        const serviceRequests = await ServiceRequest.find({
            booking: bookingId,
            status: "completed",
        });

        // Calculate service charges
        const serviceCharges = serviceRequests.map((sr) => ({
            serviceRequestId: sr._id,
            serviceType: sr.serviceType,
            description: sr.description || this.formatServiceType(sr.serviceType),
            quantity: 1,
            unitPrice: sr.finalPrice || sr.fixedPrice || 0,
            total: sr.finalPrice || sr.fixedPrice || 0,
        }));

        const serviceChargesTotal = serviceCharges.reduce((sum, sc) => sum + sc.total, 0);

        // Calculate summary
        const summary = {
            roomChargesTotal: roomCharges.subtotal,
            serviceChargesTotal: serviceChargesTotal,
            subtotal: roomCharges.subtotal + serviceChargesTotal,
            tax: 0, // Tax can be added later if needed
            grandTotal: roomCharges.subtotal + serviceChargesTotal,
        };

        // Prepare guest details
        let guestDetails;
        if (booking.guest) {
            // Registered guest
            guestDetails = {
                name: booking.guest.name,
                email: booking.guest.email,
                phone: booking.customerDetails?.phone || "",
            };
        } else {
            // Walk-in customer
            guestDetails = {
                name: booking.customerDetails.name,
                email: booking.customerDetails.email,
                phone: booking.customerDetails.phone || "",
            };
        }

        // Prepare hotel details
        const hotelDetails = {
            name: hotel.name,
            address: hotel.address,
            city: hotel.city,
            country: hotel.country,
            contactEmail: hotel.contactEmail,
            contactPhone: hotel.contactPhone,
        };

        // Prepare stay details
        const stayDetails = {
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            numberOfNights: numberOfNights,
        };

        // Generate unique invoice number
        const invoiceNumber = await Invoice.generateInvoiceNumber();

        // Create invoice
        const invoice = new Invoice({
            invoiceNumber,
            booking: bookingId,
            hotelId: hotel._id,
            guest: booking.guest?._id || null,
            guestDetails,
            hotelDetails,
            stayDetails,
            roomCharges,
            serviceCharges,
            summary,
            paymentStatus: "paid",
            generatedBy: currentUser?.id || null,
        });

        await invoice.save();

        return invoice.toJSON();
    }

    /**
     * Get invoice by booking ID
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user
     * @returns {Object} Invoice
     */
    async getInvoiceByBookingId(bookingId, currentUser) {
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        const invoice = await Invoice.findOne({ booking: bookingId });

        if (!invoice) {
            throw new Error("Invoice not found for this booking");
        }

        // Authorization check
        if (currentUser.role === "guest") {
            if (invoice.guest && invoice.guest.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only view your own invoices");
            }
        }

        return invoice.toJSON();
    }

    /**
     * Get invoice by invoice number
     * @param {string} invoiceNumber - Invoice number
     * @param {Object} currentUser - Current user
     * @returns {Object} Invoice
     */
    async getInvoiceByNumber(invoiceNumber, currentUser) {
        const invoice = await Invoice.findOne({ invoiceNumber });

        if (!invoice) {
            throw new Error("Invoice not found");
        }

        // Authorization check
        if (currentUser.role === "guest") {
            if (invoice.guest && invoice.guest.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only view your own invoices");
            }
        }

        return invoice.toJSON();
    }

    /**
     * Generate and email invoice PDF
     * @param {string} invoiceId - Invoice ID
     * @returns {Object} Updated invoice
     */
    async generateAndEmailInvoicePDF(invoiceId) {
        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            throw new Error("Invalid invoice ID");
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw new Error("Invoice not found");
        }

        // Generate PDF
        const pdfBuffer = await generateInvoicePDF(invoice);

        // Send email with PDF attachment
        const mailOptions = {
            from: `"Hotel Management System" <${process.env.SMTP_USER}>`,
            to: invoice.guestDetails.email,
            subject: `Invoice ${invoice.invoiceNumber} - ${invoice.hotelDetails.name}`,
            html: invoiceEmailTemplate(invoice),
            attachments: [
                {
                    filename: `Invoice-${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        };

        try {
            await transporter.sendMail(mailOptions);

            // Update invoice to mark email as sent
            invoice.emailSent = true;
            invoice.emailSentAt = new Date();
            await invoice.save();

            return invoice.toJSON();
        } catch (error) {
            console.error("Error sending invoice email:", error);
            throw new Error("Failed to send invoice email: " + error.message);
        }
    }

    /**
     * Download invoice PDF
     * @param {string} invoiceId - Invoice ID
     * @param {Object} currentUser - Current user
     * @returns {Buffer} PDF buffer
     */
    async downloadInvoicePDF(invoiceId, currentUser) {
        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            throw new Error("Invalid invoice ID");
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw new Error("Invoice not found");
        }

        // Authorization check
        if (currentUser.role === "guest") {
            if (invoice.guest && invoice.guest.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only download your own invoices");
            }
        }

        // Generate PDF
        const pdfBuffer = await generateInvoicePDF(invoice);

        return pdfBuffer;
    }

    /**
     * Format service type for display
     * @param {string} serviceType - Service type code
     * @returns {string} Formatted service type
     */
    formatServiceType(serviceType) {
        const typeMap = {
            cleaning: "Room Cleaning",
            housekeeping: "Housekeeping Service",
            maintenance: "Maintenance Service",
            room_service: "Room Service",
            food_service: "Food Service",
            medical_assistance: "Medical Assistance",
            massage: "Massage Service",
            gym_access: "Gym Access",
            yoga_session: "Yoga Session",
            laundry: "Laundry Service",
            spa: "Spa Service",
            transport: "Transport Service",
            room_decoration: "Room Decoration",
            other: "Other Service",
        };
        return typeMap[serviceType] || serviceType;
    }

    /**
     * Update invoice payment status
     * @param {string} invoiceId - Invoice ID
     * @param {Object} paymentData - Payment data
     * @param {Object} currentUser - Current user
     * @returns {Object} Updated invoice
     */
    async updatePaymentStatus(invoiceId, paymentData, currentUser) {
        // Only admin and receptionist can update payment status
        if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            throw new Error("Access denied. Only admin and receptionist can update payment status");
        }

        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            throw new Error("Invalid invoice ID");
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw new Error("Invoice not found");
        }

        // Update payment status
        if (paymentData.paymentStatus) {
            invoice.paymentStatus = paymentData.paymentStatus;
        }

        await invoice.save();

        return invoice.toJSON();
    }

    /**
     * Get all invoices (admin/receptionist only)
     * @param {Object} filters - Filters (hotelId, status, from, to)
     * @param {Object} pagination - Pagination options
     * @param {Object} currentUser - Current user
     * @returns {Object} Paginated invoices
     */
    async getAllInvoices(filters = {}, pagination = {}, currentUser) {
        // Only admin and receptionist can view all invoices
        if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            throw new Error("Access denied. Only admin and receptionist can view all invoices");
        }

        const query = {};

        // Apply filters
        if (filters.hotelId) {
            query.hotelId = filters.hotelId;
        }
        if (filters.paymentStatus) {
            query.paymentStatus = filters.paymentStatus;
        }

        // Apply date range filter
        if (filters.from || filters.to) {
            query.createdAt = {};
            if (filters.from) {
                const fromDate = new Date(filters.from);
                if (!isNaN(fromDate.getTime())) {
                    query.createdAt.$gte = fromDate;
                }
            }
            if (filters.to) {
                const toDate = new Date(filters.to);
                if (!isNaN(toDate.getTime())) {
                    query.createdAt.$lte = toDate;
                }
            }
            if (Object.keys(query.createdAt).length === 0) {
                delete query.createdAt;
            }
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Invoice.countDocuments(query);

        return {
            invoices,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
}

export default new InvoiceService();
