import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import transporter from "../config/nodemailer.js";
import { bookingConfirmationEmailTemplate } from "../templates/bookingConfirmationEmailTemplate.js";
import { bookingCancellationEmailTemplate } from "../templates/bookingCancellationEmailTemplate.js";

class BookingService {
    /**
     * Check if a room has overlapping bookings for the given date range
     * @param {string} roomId - Room ID
     * @param {Date} checkInDate - Check-in date
     * @param {Date} checkOutDate - Check-out date
     * @param {string} excludeBookingId - Booking ID to exclude from check (for updates)
     * @returns {boolean} True if there's an overlap, false otherwise
     */
    async hasOverlappingBooking(roomId, checkInDate, checkOutDate, excludeBookingId = null) {
        const query = {
            room: roomId,
            status: { $ne: "cancelled" }, // Only check non-cancelled bookings
            $or: [
                // New booking starts during an existing booking
                {
                    checkInDate: { $lte: checkInDate },
                    checkOutDate: { $gt: checkInDate },
                },
                // New booking ends during an existing booking
                {
                    checkInDate: { $lt: checkOutDate },
                    checkOutDate: { $gte: checkOutDate },
                },
                // New booking completely contains an existing booking
                {
                    checkInDate: { $gte: checkInDate },
                    checkOutDate: { $lte: checkOutDate },
                },
            ],
        };

        // Exclude a specific booking (useful for updates)
        if (excludeBookingId) {
            query._id = { $ne: excludeBookingId };
        }

        const overlappingBooking = await Booking.findOne(query);
        return !!overlappingBooking;
    }

    /**
     * Create a new booking
     * @param {Object} bookingData - Booking data
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Created booking
     */
    async createBooking(bookingData, currentUser) {
        const { guestId, roomId, checkInDate, checkOutDate, status, customerDetails } = bookingData;

        // Validate required fields
        if (!roomId || !checkInDate || !checkOutDate) {
            throw new Error("Room, check-in date, and check-out date are required");
        }

        // Parse dates
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        // Validate dates
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            throw new Error("Invalid date format");
        }

        // Check if check-in date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (checkIn < today) {
            throw new Error("Check-in date cannot be in the past");
        }

        // Check if check-out date is after check-in date
        if (checkOut <= checkIn) {
            throw new Error("Check-out date must be after check-in date");
        }

        // Validate room exists
        const room = await Room.findById(roomId);
        if (!room) {
            throw new Error("Room not found");
        }

        // Determine booking type and validate accordingly
        let finalGuestId = null;
        let finalCustomerDetails = null;
        let finalCreatedBy = null;

        if (currentUser.role === "guest") {
            // Guests can only book for themselves
            finalGuestId = currentUser.id;

            // If guestId is provided and doesn't match current user, reject
            if (guestId && guestId !== currentUser.id) {
                throw new Error("Guests can only create bookings for themselves");
            }

            // Guests cannot provide customerDetails (they book for themselves)
            if (customerDetails) {
                throw new Error("Guests cannot provide customer details. Use guest booking flow.");
            }
        } else if (currentUser.role === "receptionist" || currentUser.role === "admin") {
            // Receptionist and admin can book on behalf of guests OR create walk-in bookings
            if (guestId) {
                // Booking for existing guest user
                // Validate that the guest exists and has role "guest"
                const guest = await User.findById(guestId);
                if (!guest) {
                    throw new Error("Guest not found");
                }
                if (guest.role !== "guest") {
                    throw new Error("Only users with role 'guest' can be assigned to bookings");
                }

                finalGuestId = guestId;

                // Cannot have both guestId and customerDetails
                if (customerDetails) {
                    throw new Error("Cannot provide both guestId and customerDetails");
                }
            } else if (customerDetails) {
                // Walk-in booking - validate customerDetails
                if (!customerDetails.name || !customerDetails.phone) {
                    throw new Error("Customer name and phone are required for walk-in bookings");
                }

                finalCustomerDetails = {
                    name: customerDetails.name,
                    phone: customerDetails.phone,
                    email: customerDetails.email || null,
                };
            } else {
                throw new Error("Either guestId or customerDetails must be provided for staff bookings");
            }

            // Track who created the booking
            finalCreatedBy = currentUser.id;
        } else {
            throw new Error("Unauthorized to create bookings");
        }

        // Check for overlapping bookings
        const hasOverlap = await this.hasOverlappingBooking(roomId, checkIn, checkOut);
        if (hasOverlap) {
            throw new Error("Room is already booked for the selected dates");
        }

        // Create new booking
        const bookingPayload = {
            guest: finalGuestId,
            room: roomId,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            status: status || "pending",
        };

        // Only include customerDetails if it's not null
        if (finalCustomerDetails) {
            bookingPayload.customerDetails = finalCustomerDetails;
        }

        // Only include createdBy if it's not null
        if (finalCreatedBy) {
            bookingPayload.createdBy = finalCreatedBy;
        }

        const newBooking = new Booking(bookingPayload);

        await newBooking.save();

        // Populate guest, createdBy, and room details (only populate if they exist)
        const populatePaths = [
            { path: "room", select: "roomNumber roomType pricePerNight images" },
        ];

        if (finalGuestId) {
            populatePaths.push({ path: "guest", select: "name email role" });
        }

        if (finalCreatedBy) {
            populatePaths.push({ path: "createdBy", select: "name email role" });
        }

        await newBooking.populate(populatePaths);

        // Send booking confirmation email (non-blocking - should not fail booking logic)
        try {
            const checkInFormatted = checkIn.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const checkOutFormatted = checkOut.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Determine recipient email and name
            let recipientEmail = null;
            let recipientName = null;

            if (finalGuestId && newBooking.guest) {
                // Guest booking - use guest's email
                recipientEmail = newBooking.guest.email;
                recipientName = newBooking.guest.name;
            } else if (finalCustomerDetails && finalCustomerDetails.email) {
                // Walk-in booking with email
                recipientEmail = finalCustomerDetails.email;
                recipientName = finalCustomerDetails.name;
            }

            // Only send email if we have an email address
            if (recipientEmail) {
                const mailOptions = {
                    from: `"Hotel Management System" <${process.env.SMTP_USER}>`,
                    to: recipientEmail,
                    subject: "Booking Confirmation - Hotel Management System",
                    html: bookingConfirmationEmailTemplate(
                        recipientName,
                        newBooking.room.roomNumber,
                        newBooking.room.roomType,
                        checkInFormatted,
                        checkOutFormatted,
                        newBooking.status
                    ),
                };

                await transporter.sendMail(mailOptions);
            }
        } catch (emailError) {
            // Log email error but don't fail the booking
            console.error("Failed to send booking confirmation email:", emailError.message);
        }

        return newBooking.toJSON();
    }

    /**
     * Get all bookings with optional filtering and pagination
     * @param {Object} filters - Optional filters (status, guestId, roomId)
     * @param {Object} pagination - Pagination options (page, limit)
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Paginated bookings with metadata
     */
    async getAllBookings(filters = {}, pagination = {}, currentUser) {
        const query = {};

        // Role-based filtering
        if (currentUser.role === "guest") {
            // Guests can only see their own bookings (guest bookings only)
            query.guest = currentUser.id;
        } else if (currentUser.role === "receptionist" || currentUser.role === "admin") {
            // Receptionist and admin can see all bookings (both guest and walk-in)
            // Apply optional filters
            if (filters.guestId) {
                // Filter by guest ID (only guest bookings)
                query.guest = filters.guestId;
            }
            if (filters.roomId) {
                query.room = filters.roomId;
            }
            // Note: Walk-in bookings will be included automatically (no guest filter)
        } else {
            throw new Error("Unauthorized to view bookings");
        }

        // Apply status filter
        if (filters.status) {
            query.status = filters.status;
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination metadata
        const totalBookings = await Booking.countDocuments(query);

        // Get paginated bookings
        const bookings = await Booking.find(query)
            .populate("guest", "name email role")
            .populate("createdBy", "name email role")
            .populate("room", "roomNumber roomType pricePerNight images")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate total pages
        const totalPages = Math.ceil(totalBookings / limit);

        return {
            bookings: bookings.map((booking) => booking.toJSON()),
            pagination: {
                totalBookings,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }

    /**
     * Get a single booking by ID
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Booking object
     */
    async getBookingById(bookingId, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        const booking = await Booking.findById(bookingId)
            .populate("guest", "name email role")
            .populate("createdBy", "name email role")
            .populate("room", "roomNumber roomType pricePerNight images");

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Role-based access control
        if (currentUser.role === "guest") {
            // Guests can only view their own bookings (must have guest field)
            if (!booking.guest) {
                throw new Error("Access denied. You can only view your own bookings");
            }
            if (booking.guest._id.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only view your own bookings");
            }
        } else if (currentUser.role !== "receptionist" && currentUser.role !== "admin") {
            throw new Error("Unauthorized to view bookings");
        }
        // Receptionist and admin can view all bookings (both guest and walk-in)

        return booking.toJSON();
    }

    /**
     * Cancel a booking
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Updated booking
     */
    async cancelBooking(bookingId, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        const booking = await Booking.findById(bookingId)
            .populate("guest", "name email role")
            .populate("room", "roomNumber roomType pricePerNight images");

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Check if booking is already cancelled
        if (booking.status === "cancelled") {
            throw new Error("Booking is already cancelled");
        }

        // Role-based authorization
        if (currentUser.role === "guest") {
            // Guests can only cancel their own bookings (must have guest field)
            if (!booking.guest) {
                throw new Error("Access denied. You can only cancel your own bookings");
            }
            if (booking.guest._id.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only cancel your own bookings");
            }
        } else if (currentUser.role !== "receptionist" && currentUser.role !== "admin") {
            throw new Error("Unauthorized to cancel bookings");
        }
        // Receptionist and admin can cancel any booking (both guest and walk-in)

        // Update booking status to cancelled
        booking.status = "cancelled";
        await booking.save();

        // Send booking cancellation email (non-blocking - should not fail cancellation logic)
        try {
            const checkInFormatted = booking.checkInDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const checkOutFormatted = booking.checkOutDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Determine recipient email and name
            let recipientEmail = null;
            let recipientName = null;

            if (booking.guest) {
                // Guest booking - use guest's email
                recipientEmail = booking.guest.email;
                recipientName = booking.guest.name;
            } else if (booking.customerDetails && booking.customerDetails.email) {
                // Walk-in booking with email
                recipientEmail = booking.customerDetails.email;
                recipientName = booking.customerDetails.name;
            }

            // Only send email if we have an email address
            if (recipientEmail) {
                const mailOptions = {
                    from: `"Hotel Management System" <${process.env.SMTP_USER}>`,
                    to: recipientEmail,
                    subject: "Booking Cancellation Confirmation - Hotel Management System",
                    html: bookingCancellationEmailTemplate(
                        recipientName,
                        booking.room.roomNumber,
                        booking.room.roomType,
                        checkInFormatted,
                        checkOutFormatted
                    ),
                };

                await transporter.sendMail(mailOptions);
            }
        } catch (emailError) {
            // Log email error but don't fail the cancellation
            console.error("Failed to send booking cancellation email:", emailError.message);
        }

        return booking.toJSON();
    }

    /**
     * Get bookings for the current logged-in user (guest)
     * @param {Object} currentUser - Current user making the request
     * @param {Object} pagination - Pagination options (page, limit)
     * @returns {Object} Paginated bookings
     */
    async getMyBookings(currentUser, pagination = {}) {
        if (currentUser.role !== "guest") {
            throw new Error("This endpoint is only for guests. Use getAllBookings for staff.");
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { guest: currentUser.id };

        // Get total count for pagination metadata
        const totalBookings = await Booking.countDocuments(query);

        // Get paginated bookings
        const bookings = await Booking.find(query)
            .populate("room", "roomNumber roomType pricePerNight images")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate total pages
        const totalPages = Math.ceil(totalBookings / limit);

        return {
            bookings: bookings.map((booking) => booking.toJSON()),
            pagination: {
                totalBookings,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }
}

export default new BookingService();

