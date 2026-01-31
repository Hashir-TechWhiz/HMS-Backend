import PublicFacilityBooking from "../models/PublicFacilityBooking.js";
import PublicFacility from "../models/PublicFacility.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import transporter from "../config/nodemailer.js";

class PublicFacilityBookingService {
    /**
     * Check facility availability for given date/time range
     * @param {string} facilityId - Facility ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} startTime - Start time (optional, for hourly bookings)
     * @param {string} endTime - End time (optional, for hourly bookings)
     * @returns {Object} Availability status
     */
    async checkAvailability(facilityId, startDate, endDate, startTime = null, endTime = null) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(facilityId)) {
            throw new Error("Invalid facility ID");
        }

        // Validate facility exists
        const facility = await PublicFacility.findById(facilityId);
        if (!facility) {
            throw new Error("Facility not found");
        }

        if (facility.status !== "available") {
            throw new Error("Facility is not available for booking");
        }

        // Parse dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error("Invalid date format");
        }

        // Check if start date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (start < today) {
            throw new Error("Start date cannot be in the past");
        }

        // Check if end date is after start date
        if (end <= start) {
            throw new Error("End date must be after start date");
        }

        // Validate times if provided
        if (startTime && endTime) {
            const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
                throw new Error("Invalid time format. Use HH:MM format");
            }
        }

        // Check for overlapping bookings
        const hasOverlap = await this.hasOverlappingBooking(facilityId, start, end, startTime, endTime);

        return {
            available: !hasOverlap,
            facilityId,
            startDate: start,
            endDate: end,
            startTime,
            endTime,
        };
    }

    /**
     * Check if a facility has overlapping bookings for the given date/time range
     * @param {string} facilityId - Facility ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} startTime - Start time (optional)
     * @param {string} endTime - End time (optional)
     * @param {string} excludeBookingId - Booking ID to exclude from check (for updates)
     * @returns {boolean} True if there's an overlap, false otherwise
     */
    async hasOverlappingBooking(facilityId, startDate, endDate, startTime = null, endTime = null, excludeBookingId = null) {
        let overlapConditions = [];

        if (startTime && endTime) {
            // For hourly bookings, check if dates and times overlap
            overlapConditions = [
                {
                    startDate: { $lte: startDate },
                    endDate: { $gte: startDate },
                    $or: [
                        {
                            startTime: { $lte: startTime },
                            endTime: { $gt: startTime },
                        },
                        {
                            startTime: { $lt: endTime },
                            endTime: { $gte: endTime },
                        },
                        {
                            startTime: { $gte: startTime },
                            endTime: { $lte: endTime },
                        },
                    ],
                },
            ];
        } else {
            // For daily bookings, check date overlap only
            overlapConditions = [
                {
                    startDate: { $lte: startDate },
                    endDate: { $gt: startDate },
                },
                {
                    startDate: { $lt: endDate },
                    endDate: { $gte: endDate },
                },
                {
                    startDate: { $gte: startDate },
                    endDate: { $lte: endDate },
                },
            ];
        }

        const query = {
            facility: facilityId,
            status: { $ne: "cancelled" },
            $or: overlapConditions,
        };

        if (excludeBookingId) {
            query._id = { $ne: excludeBookingId };
        }

        const overlappingBooking = await PublicFacilityBooking.findOne(query);
        return !!overlappingBooking;
    }

    /**
     * Create a new facility booking
     * @param {Object} bookingData - Booking data
     * @param {Object} currentUser - Current user
     * @returns {Object} Created booking
     */
    async createBooking(bookingData, currentUser) {
        try {
            // Validate facility exists
            const facility = await PublicFacility.findById(bookingData.facility);
            if (!facility) {
                throw new Error("Facility not found");
            }

            if (facility.status !== "available") {
                throw new Error("Facility is not available for booking");
            }

            // Check capacity
            if (bookingData.numberOfGuests > facility.capacity) {
                throw new Error(`Number of guests exceeds facility capacity of ${facility.capacity}`);
            }

            // Set hotelId from facility
            bookingData.hotelId = facility.hotelId;

            // Role-based logic
            if (currentUser.role === "guest") {
                // Guest books for themselves
                bookingData.guest = currentUser._id;
                bookingData.createdBy = currentUser._id;
                bookingData.customerDetails = {
                    name: currentUser.name,
                    phone: currentUser.phone,
                    email: currentUser.email,
                };
            } else if (["receptionist", "admin"].includes(currentUser.role)) {
                // Staff can book for guests or walk-in customers
                bookingData.createdBy = currentUser._id;

                if (bookingData.guest) {
                    // Booking for a registered guest
                    const guest = await User.findById(bookingData.guest);
                    if (!guest || guest.role !== "guest") {
                        throw new Error("Invalid guest user");
                    }
                    bookingData.customerDetails = {
                        name: guest.name,
                        phone: guest.phone,
                        email: guest.email,
                    };
                } else if (bookingData.customerDetails) {
                    // Walk-in customer
                    if (!bookingData.customerDetails.name || !bookingData.customerDetails.phone) {
                        throw new Error("Customer name and phone are required for walk-in bookings");
                    }
                }
            }

            // Calculate charges
            const { facilityCharges, totalAmount } = this.calculateCharges(
                facility,
                bookingData.bookingType,
                new Date(bookingData.startDate),
                new Date(bookingData.endDate),
                bookingData.startTime,
                bookingData.endTime
            );

            bookingData.facilityCharges = facilityCharges;
            bookingData.totalAmount = totalAmount;

            // Create booking
            const booking = await PublicFacilityBooking.create(bookingData);

            // Populate references
            await booking.populate([
                { path: "facility", select: "name facilityType pricePerHour pricePerDay capacity" },
                { path: "guest", select: "name email phone" },
                { path: "createdBy", select: "name email role" },
                { path: "hotelId", select: "name code" },
            ]);

            // Send confirmation email if guest email exists
            if (booking.customerDetails?.email) {
                await this.sendBookingConfirmationEmail(booking);
            }

            return booking;
        } catch (error) {
            throw new Error(`Failed to create booking: ${error.message}`);
        }
    }

    /**
     * Calculate facility charges
     * @param {Object} facility - Facility object
     * @param {string} bookingType - "hourly" or "daily"
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} startTime - Start time (for hourly)
     * @param {string} endTime - End time (for hourly)
     * @returns {Object} Charges
     */
    calculateCharges(facility, bookingType, startDate, endDate, startTime = null, endTime = null) {
        let facilityCharges = 0;

        if (bookingType === "hourly" && startTime && endTime) {
            // Calculate hours
            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);
            const hours = endHour - startHour + (endMinute - startMinute) / 60;

            facilityCharges = hours * facility.pricePerHour;
        } else if (bookingType === "daily") {
            // Calculate days
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            facilityCharges = days * (facility.pricePerDay || facility.pricePerHour * 24);
        }

        const totalAmount = facilityCharges;

        return { facilityCharges, totalAmount };
    }

    /**
     * Get all bookings with filters
     * @param {Object} filters - Filter criteria
     * @param {Object} pagination - Pagination options
     * @param {Object} currentUser - Current user
     * @returns {Object} Bookings and pagination
     */
    async getAllBookings(filters = {}, pagination = {}, currentUser) {
        try {
            const query = {};

            // Apply hotel filter
            if (currentUser.hotelId) {
                query.hotelId = currentUser.hotelId;
            }

            // Role-based access
            if (currentUser.role === "guest") {
                query.guest = currentUser._id;
            }

            // Apply filters
            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.facilityId) {
                query.facility = filters.facilityId;
            }

            if (filters.guestId && ["receptionist", "admin"].includes(currentUser.role)) {
                query.guest = filters.guestId;
            }

            if (filters.from || filters.to) {
                query.startDate = {};
                if (filters.from) {
                    query.startDate.$gte = new Date(filters.from);
                }
                if (filters.to) {
                    query.startDate.$lte = new Date(filters.to);
                }
            }

            // Pagination
            const page = parseInt(pagination.page) || 1;
            const limit = parseInt(pagination.limit) || 10;
            const skip = (page - 1) * limit;

            const bookings = await PublicFacilityBooking.find(query)
                .populate("facility", "name facilityType pricePerHour pricePerDay")
                .populate("guest", "name email phone")
                .populate("createdBy", "name email role")
                .populate("hotelId", "name code")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await PublicFacilityBooking.countDocuments(query);

            return {
                bookings,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            throw new Error(`Failed to get bookings: ${error.message}`);
        }
    }

    /**
     * Get booking by ID
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user
     * @returns {Object} Booking
     */
    async getBookingById(bookingId, currentUser) {
        try {
            if (!mongoose.Types.ObjectId.isValid(bookingId)) {
                throw new Error("Invalid booking ID");
            }

            const booking = await PublicFacilityBooking.findById(bookingId)
                .populate("facility", "name facilityType pricePerHour pricePerDay capacity amenities")
                .populate("guest", "name email phone")
                .populate("createdBy", "name email role")
                .populate("hotelId", "name code");

            if (!booking) {
                throw new Error("Booking not found");
            }

            // Check access
            if (currentUser.role === "guest" && booking.guest?._id.toString() !== currentUser._id.toString()) {
                throw new Error("You do not have access to this booking");
            }

            if (currentUser.hotelId && booking.hotelId._id.toString() !== currentUser.hotelId.toString()) {
                throw new Error("You do not have access to this booking");
            }

            return booking;
        } catch (error) {
            throw new Error(`Failed to get booking: ${error.message}`);
        }
    }

    /**
     * Cancel a booking
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user
     * @param {Object} penaltyData - Cancellation penalty data
     * @returns {Object} Updated booking
     */
    async cancelBooking(bookingId, currentUser, penaltyData = {}) {
        try {
            if (!mongoose.Types.ObjectId.isValid(bookingId)) {
                throw new Error("Invalid booking ID");
            }

            const booking = await PublicFacilityBooking.findById(bookingId);

            if (!booking) {
                throw new Error("Booking not found");
            }

            if (booking.status === "cancelled") {
                throw new Error("Booking is already cancelled");
            }

            if (booking.status === "completed") {
                throw new Error("Cannot cancel a completed booking");
            }

            // Check access
            if (currentUser.role === "guest") {
                if (booking.guest?.toString() !== currentUser._id.toString()) {
                    throw new Error("You can only cancel your own bookings");
                }
            }

            // Update booking
            booking.status = "cancelled";
            booking.cancelledBy = currentUser._id;
            booking.cancellationDate = new Date();
            booking.cancellationReason = penaltyData.reason || "Cancelled by user";

            if (penaltyData.penalty && ["receptionist", "admin"].includes(currentUser.role)) {
                booking.cancellationPenalty = penaltyData.penalty;
            }

            await booking.save();

            // Populate references
            await booking.populate([
                { path: "facility", select: "name facilityType" },
                { path: "guest", select: "name email phone" },
                { path: "cancelledBy", select: "name email role" },
            ]);

            // Send cancellation email
            if (booking.customerDetails?.email) {
                await this.sendBookingCancellationEmail(booking);
            }

            return booking;
        } catch (error) {
            throw new Error(`Failed to cancel booking: ${error.message}`);
        }
    }

    /**
     * Confirm a booking
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user
     * @returns {Object} Updated booking
     */
    async confirmBooking(bookingId, currentUser) {
        try {
            if (!mongoose.Types.ObjectId.isValid(bookingId)) {
                throw new Error("Invalid booking ID");
            }

            const booking = await PublicFacilityBooking.findById(bookingId);

            if (!booking) {
                throw new Error("Booking not found");
            }

            if (booking.status !== "pending") {
                throw new Error("Only pending bookings can be confirmed");
            }

            booking.status = "confirmed";
            await booking.save();

            await booking.populate([
                { path: "facility", select: "name facilityType" },
                { path: "guest", select: "name email phone" },
            ]);

            return booking;
        } catch (error) {
            throw new Error(`Failed to confirm booking: ${error.message}`);
        }
    }

    /**
     * Check-in a booking
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user
     * @returns {Object} Updated booking
     */
    async checkInBooking(bookingId, currentUser) {
        try {
            if (!mongoose.Types.ObjectId.isValid(bookingId)) {
                throw new Error("Invalid booking ID");
            }

            const booking = await PublicFacilityBooking.findById(bookingId);

            if (!booking) {
                throw new Error("Booking not found");
            }

            if (booking.status === "cancelled") {
                throw new Error("Cannot check-in a cancelled booking");
            }

            if (booking.isCheckedIn) {
                throw new Error("Booking is already checked in");
            }

            booking.isCheckedIn = true;
            booking.status = "in_use";
            booking.checkInDetails = {
                checkedInAt: new Date(),
                checkedInBy: currentUser._id,
            };

            await booking.save();

            await booking.populate([
                { path: "facility", select: "name facilityType" },
                { path: "guest", select: "name email phone" },
                { path: "checkInDetails.checkedInBy", select: "name email role" },
            ]);

            return booking;
        } catch (error) {
            throw new Error(`Failed to check-in booking: ${error.message}`);
        }
    }

    /**
     * Check-out a booking
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user
     * @returns {Object} Updated booking
     */
    async checkOutBooking(bookingId, currentUser) {
        try {
            if (!mongoose.Types.ObjectId.isValid(bookingId)) {
                throw new Error("Invalid booking ID");
            }

            const booking = await PublicFacilityBooking.findById(bookingId);

            if (!booking) {
                throw new Error("Booking not found");
            }

            if (booking.status === "cancelled") {
                throw new Error("Cannot check-out a cancelled booking");
            }

            if (!booking.isCheckedIn) {
                throw new Error("Booking must be checked in before checking out");
            }

            if (booking.isCheckedOut) {
                throw new Error("Booking is already checked out");
            }

            booking.isCheckedOut = true;
            booking.status = "completed";
            booking.checkOutDetails = {
                checkedOutAt: new Date(),
                checkedOutBy: currentUser._id,
            };

            await booking.save();

            await booking.populate([
                { path: "facility", select: "name facilityType" },
                { path: "guest", select: "name email phone" },
                { path: "checkOutDetails.checkedOutBy", select: "name email role" },
            ]);

            return booking;
        } catch (error) {
            throw new Error(`Failed to check-out booking: ${error.message}`);
        }
    }

    /**
     * Send booking confirmation email
     * @param {Object} booking - Booking object
     */
    async sendBookingConfirmationEmail(booking) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: booking.customerDetails.email,
                subject: `Facility Booking Confirmation - ${booking.facility.name}`,
                html: `
                    <h2>Booking Confirmation</h2>
                    <p>Dear ${booking.customerDetails.name},</p>
                    <p>Your booking for ${booking.facility.name} has been confirmed.</p>
                    <h3>Booking Details:</h3>
                    <ul>
                        <li><strong>Facility:</strong> ${booking.facility.name} (${booking.facility.facilityType})</li>
                        <li><strong>Booking ID:</strong> ${booking._id}</li>
                        <li><strong>Start Date:</strong> ${booking.startDate.toLocaleDateString()}</li>
                        <li><strong>End Date:</strong> ${booking.endDate.toLocaleDateString()}</li>
                        ${booking.startTime ? `<li><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</li>` : ""}
                        <li><strong>Number of Guests:</strong> ${booking.numberOfGuests}</li>
                        <li><strong>Total Amount:</strong> $${booking.totalAmount.toFixed(2)}</li>
                        <li><strong>Status:</strong> ${booking.status}</li>
                    </ul>
                    <p>Thank you for choosing our facility!</p>
                `,
            };

            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error("Failed to send confirmation email:", error.message);
        }
    }

    /**
     * Send booking cancellation email
     * @param {Object} booking - Booking object
     */
    async sendBookingCancellationEmail(booking) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: booking.customerDetails.email,
                subject: `Facility Booking Cancelled - ${booking.facility.name}`,
                html: `
                    <h2>Booking Cancellation</h2>
                    <p>Dear ${booking.customerDetails.name},</p>
                    <p>Your booking for ${booking.facility.name} has been cancelled.</p>
                    <h3>Booking Details:</h3>
                    <ul>
                        <li><strong>Facility:</strong> ${booking.facility.name} (${booking.facility.facilityType})</li>
                        <li><strong>Booking ID:</strong> ${booking._id}</li>
                        <li><strong>Cancellation Date:</strong> ${booking.cancellationDate.toLocaleDateString()}</li>
                        <li><strong>Reason:</strong> ${booking.cancellationReason}</li>
                        ${booking.cancellationPenalty > 0 ? `<li><strong>Cancellation Penalty:</strong> $${booking.cancellationPenalty.toFixed(2)}</li>` : ""}
                    </ul>
                    <p>If you have any questions, please contact us.</p>
                `,
            };

            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error("Failed to send cancellation email:", error.message);
        }
    }
}

export default new PublicFacilityBookingService();
