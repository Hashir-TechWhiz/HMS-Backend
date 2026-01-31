import Booking from "../models/Booking.js";
import PublicFacilityBooking from "../models/PublicFacilityBooking.js";
import Room from "../models/Room.js";
import mongoose from "mongoose";

class PaymentService {
    /**
     * Calculate total amount for a booking
     * @param {Object} booking - Booking object
     * @returns {number} Total amount
     */
    async calculateBookingAmount(booking) {
        if (!booking.room || !booking.checkInDate || !booking.checkOutDate) {
            throw new Error("Booking must have room and dates to calculate amount");
        }

        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        const pricePerNight = booking.room.pricePerNight || 0;
        const roomCharges = nights * pricePerNight;

        // Get service charges for this booking
        const ServiceRequest = mongoose.model("ServiceRequest");
        const serviceRequests = await ServiceRequest.find({
            booking: booking._id,
            status: "completed", // Only include completed services
        });

        // Calculate total service charges (use finalPrice if available, otherwise fixedPrice)
        const serviceCharges = serviceRequests.reduce((total, service) => {
            const price = service.finalPrice || service.fixedPrice || 0;
            return total + price;
        }, 0);

        return {
            roomCharges,
            serviceCharges,
            totalAmount: roomCharges + serviceCharges
        };
    }

    /**
     * Update payment status based on total paid
     * @param {Object} booking - Booking object
     */
    updatePaymentStatus(booking) {
        const totalAmount = booking.totalAmount || 0;
        const totalPaid = booking.totalPaid || 0;

        if (totalPaid === 0) {
            booking.paymentStatus = "unpaid";
        } else if (totalPaid >= totalAmount) {
            booking.paymentStatus = "paid";
        } else {
            booking.paymentStatus = "partially_paid";
        }
    }

    /**
     * Add payment to a booking (supports both room and facility bookings)
     * @param {string} bookingId - Booking ID
     * @param {Object} paymentData - Payment data (amount, paymentMethod, transactionId, notes, bookingType)
     * @param {Object} currentUser - Current user making the payment
     * @returns {Object} Updated booking
     */
    async addPayment(bookingId, paymentData, currentUser) {
        const bookingType = paymentData.bookingType || "room"; // Default to room booking for backward compatibility
        
        if (bookingType === "facility") {
            return await this.addFacilityPayment(bookingId, paymentData, currentUser);
        }
        
        // Original room booking payment logic follows
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        // Validate payment data
        const { amount, paymentMethod, transactionId, notes } = paymentData;

        if (!amount || amount <= 0) {
            throw new Error("Payment amount must be greater than 0");
        }

        if (!paymentMethod || !["card", "cash"].includes(paymentMethod)) {
            throw new Error("Payment method must be either 'card' or 'cash'");
        }

        // Find booking
        const booking = await Booking.findById(bookingId)
            .populate("room", "roomNumber roomType pricePerNight")
            .populate("guest", "name email");

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Authorization check
        if (currentUser.role === "guest") {
            // Guests can only add payments to their own bookings
            if (!booking.guest || booking.guest._id.toString() !== currentUser.id) {
                throw new Error("You can only add payments to your own bookings");
            }
            // Guests can only use card payment (cash payment is staff-only)
            if (paymentMethod === "cash") {
                throw new Error("Cash payment is not available for guest checkout. Please use card payment.");
            }
        } else if (currentUser.role !== "receptionist" && currentUser.role !== "admin") {
            throw new Error("Unauthorized to add payments");
        }

        // Check if booking is cancelled
        if (booking.status === "cancelled") {
            throw new Error("Cannot add payment to a cancelled booking");
        }

        // ALWAYS recalculate amounts to include any new services added after booking
        const amounts = await this.calculateBookingAmount(booking);
        booking.roomCharges = amounts.roomCharges;
        booking.serviceCharges = amounts.serviceCharges;
        booking.totalAmount = amounts.totalAmount;

        // Check if payment exceeds remaining balance
        const remainingBalance = booking.totalAmount - (booking.totalPaid || 0);
        
        console.log("Payment Validation:", {
            bookingId: booking._id.toString(),
            roomCharges: amounts.roomCharges,
            serviceCharges: amounts.serviceCharges,
            totalAmount: booking.totalAmount,
            totalPaid: booking.totalPaid || 0,
            remainingBalance,
            attemptedPayment: amount
        });

        if (amount > remainingBalance) {
            throw new Error(`Payment amount (${amount}) exceeds remaining balance (${remainingBalance})`);
        }

        // Create payment record
        const payment = {
            amount,
            paymentMethod,
            paymentDate: new Date(),
            processedBy: currentUser.id,
            transactionId: transactionId || null,
            notes: notes || null,
        };

        // Add payment to booking
        booking.payments.push(payment);
        booking.totalPaid = (booking.totalPaid || 0) + amount;

        // Update payment status
        this.updatePaymentStatus(booking);

        await booking.save();

        // Populate the processedBy field for the new payment
        await booking.populate("payments.processedBy", "name email role");

        return booking.toJSON();
    }

    /**
     * Get all payments for a booking
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user
     * @returns {Object} Booking with payments
     */
    async getBookingPayments(bookingId, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        const booking = await Booking.findById(bookingId)
            .populate("room", "roomNumber roomType pricePerNight")
            .populate("guest", "name email")
            .populate("payments.processedBy", "name email role");

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Authorization check
        if (currentUser.role === "guest") {
            // Guests can only view payments for their own bookings
            if (!booking.guest || booking.guest._id.toString() !== currentUser.id) {
                throw new Error("You can only view payments for your own bookings");
            }
        } else if (currentUser.role === "receptionist") {
            // Receptionist can only view payments for bookings in their hotel
            if (currentUser.hotelId && booking.hotelId.toString() !== currentUser.hotelId.toString()) {
                throw new Error("You can only view payments for bookings in your hotel");
            }
        } else if (currentUser.role !== "admin") {
            throw new Error("Unauthorized to view payments");
        }

        // Calculate total amount if not set
        if (!booking.totalAmount || !booking.roomCharges || !booking.serviceCharges) {
            const amounts = await this.calculateBookingAmount(booking);
            booking.roomCharges = amounts.roomCharges;
            booking.serviceCharges = amounts.serviceCharges;
            booking.totalAmount = amounts.totalAmount;
            await booking.save();
        }

        // Fetch completed service requests for detailed breakdown
        const ServiceRequest = mongoose.model("ServiceRequest");
        const serviceRequests = await ServiceRequest.find({
            booking: bookingId,
            status: "completed"
        }).select("serviceType description fixedPrice finalPrice completedAt");

        // Format service requests for response
        const serviceDetails = serviceRequests.map(sr => ({
            serviceType: sr.serviceType,
            description: sr.description || this.formatServiceType(sr.serviceType),
            price: sr.finalPrice || sr.fixedPrice || 0,
            completedAt: sr.completedAt
        }));

        return {
            bookingId: booking._id,
            bookingStatus: booking.status,
            room: booking.room,
            guest: booking.guest,
            customerDetails: booking.customerDetails,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            roomCharges: booking.roomCharges,
            serviceCharges: booking.serviceCharges,
            serviceDetails: serviceDetails, // Array of individual services
            totalAmount: booking.totalAmount,
            totalPaid: booking.totalPaid,
            balance: booking.totalAmount - (booking.totalPaid || 0),
            paymentStatus: booking.paymentStatus,
            payments: booking.payments,
        };
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
        return typeMap[serviceType] || serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Get all payments for current user's bookings (guest only)
     * @param {Object} currentUser - Current user
     * @param {Object} pagination - Pagination options
     * @returns {Object} Paginated bookings with payment info
     */
    async getMyPayments(currentUser, pagination = {}) {
        if (currentUser.role !== "guest") {
            throw new Error("This endpoint is only for guests");
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { guest: currentUser.id };

        // Get total count
        const totalBookings = await Booking.countDocuments(query);

        // Get paginated bookings
        const bookings = await Booking.find(query)
            .populate("room", "roomNumber roomType pricePerNight")
            .populate("payments.processedBy", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate total amount for each booking if not set
        for (const booking of bookings) {
            if (!booking.totalAmount || !booking.roomCharges || !booking.serviceCharges) {
                const amounts = await this.calculateBookingAmount(booking);
                booking.roomCharges = amounts.roomCharges;
                booking.serviceCharges = amounts.serviceCharges;
                booking.totalAmount = amounts.totalAmount;
                await booking.save();
            }
        }

        // Fetch service requests for all bookings
        const ServiceRequest = mongoose.model("ServiceRequest");
        const bookingIds = bookings.map(b => b._id);
        const allServiceRequests = await ServiceRequest.find({
            booking: { $in: bookingIds },
            status: "completed"
        }).select("booking serviceType description fixedPrice finalPrice completedAt");

        // Group service requests by booking ID
        const servicesByBooking = {};
        allServiceRequests.forEach(sr => {
            const bookingId = sr.booking.toString();
            if (!servicesByBooking[bookingId]) {
                servicesByBooking[bookingId] = [];
            }
            servicesByBooking[bookingId].push({
                serviceType: sr.serviceType,
                description: sr.description || this.formatServiceType(sr.serviceType),
                price: sr.finalPrice || sr.fixedPrice || 0,
                completedAt: sr.completedAt
            });
        });

        // Format response
        const paymentsData = bookings.map((booking) => ({
            bookingId: booking._id,
            bookingStatus: booking.status,
            room: booking.room,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            roomCharges: booking.roomCharges || 0,
            serviceCharges: booking.serviceCharges || 0,
            serviceDetails: servicesByBooking[booking._id.toString()] || [],
            totalAmount: booking.totalAmount,
            totalPaid: booking.totalPaid,
            balance: booking.totalAmount - (booking.totalPaid || 0),
            paymentStatus: booking.paymentStatus,
            payments: booking.payments,
            createdAt: booking.createdAt,
        }));

        const totalPages = Math.ceil(totalBookings / limit);

        return {
            payments: paymentsData,
            pagination: {
                totalBookings,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }

    /**
     * Get balance for a booking
     * @param {string} bookingId - Booking ID
     * @param {Object} currentUser - Current user
     * @returns {Object} Balance information
     */
    async getBookingBalance(bookingId, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        const booking = await Booking.findById(bookingId)
            .populate("room", "roomNumber roomType pricePerNight")
            .populate("guest", "name email");

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Authorization check
        if (currentUser.role === "guest") {
            if (!booking.guest || booking.guest._id.toString() !== currentUser.id) {
                throw new Error("You can only view balance for your own bookings");
            }
        } else if (currentUser.role === "receptionist") {
            if (currentUser.hotelId && booking.hotelId.toString() !== currentUser.hotelId.toString()) {
                throw new Error("You can only view balance for bookings in your hotel");
            }
        } else if (currentUser.role !== "admin") {
            throw new Error("Unauthorized to view balance");
        }

        // ALWAYS recalculate amounts to include any new services added after booking
        const amounts = await this.calculateBookingAmount(booking);
        booking.roomCharges = amounts.roomCharges;
        booking.serviceCharges = amounts.serviceCharges;
        booking.totalAmount = amounts.totalAmount;
        await booking.save();

        const balance = booking.totalAmount - (booking.totalPaid || 0);

        return {
            bookingId: booking._id,
            roomCharges: booking.roomCharges,
            serviceCharges: booking.serviceCharges,
            totalAmount: booking.totalAmount,
            totalPaid: booking.totalPaid,
            balance,
            paymentStatus: booking.paymentStatus,
        };
    }

    /**
     * Get all payments (admin/receptionist only)
     * @param {Object} filters - Filters (hotelId, status, from, to)
     * @param {Object} pagination - Pagination options
     * @param {Object} currentUser - Current user
     * @returns {Object} Paginated payments
     */
    async getAllPayments(filters = {}, pagination = {}, currentUser) {
        // Authorization check
        if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            throw new Error("Unauthorized to view all payments");
        }

        const query = {};

        // Receptionist: filter by hotel
        if (currentUser.role === "receptionist") {
            if (currentUser.hotelId) {
                query.hotelId = currentUser.hotelId;
            } else {
                throw new Error("Receptionist must be assigned to a hotel");
            }
        }

        // Apply filters
        if (filters.hotelId && currentUser.role === "admin") {
            query.hotelId = filters.hotelId;
        }

        if (filters.paymentStatus) {
            query.paymentStatus = filters.paymentStatus;
        }

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

        // Get total count
        const totalBookings = await Booking.countDocuments(query);

        // Get paginated bookings
        const bookings = await Booking.find(query)
            .populate("room", "roomNumber roomType pricePerNight")
            .populate("guest", "name email")
            .populate("payments.processedBy", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate total amount for each booking if not set
        for (const booking of bookings) {
            if (!booking.totalAmount || !booking.roomCharges || !booking.serviceCharges) {
                const amounts = await this.calculateBookingAmount(booking);
                booking.roomCharges = amounts.roomCharges;
                booking.serviceCharges = amounts.serviceCharges;
                booking.totalAmount = amounts.totalAmount;
                await booking.save();
            }
        }

        // Fetch service requests for all bookings
        const ServiceRequest = mongoose.model("ServiceRequest");
        const bookingIds = bookings.map(b => b._id);
        const allServiceRequests = await ServiceRequest.find({
            booking: { $in: bookingIds },
            status: "completed"
        }).select("booking serviceType description fixedPrice finalPrice completedAt");

        // Group service requests by booking ID
        const servicesByBooking = {};
        allServiceRequests.forEach(sr => {
            const bookingId = sr.booking.toString();
            if (!servicesByBooking[bookingId]) {
                servicesByBooking[bookingId] = [];
            }
            servicesByBooking[bookingId].push({
                serviceType: sr.serviceType,
                description: sr.description || this.formatServiceType(sr.serviceType),
                price: sr.finalPrice || sr.fixedPrice || 0,
                completedAt: sr.completedAt
            });
        });

        // Format response
        const paymentsData = bookings.map((booking) => ({
            bookingId: booking._id,
            bookingStatus: booking.status,
            room: booking.room,
            guest: booking.guest,
            customerDetails: booking.customerDetails,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            roomCharges: booking.roomCharges || 0,
            serviceCharges: booking.serviceCharges || 0,
            serviceDetails: servicesByBooking[booking._id.toString()] || [],
            totalAmount: booking.totalAmount,
            totalPaid: booking.totalPaid,
            balance: booking.totalAmount - (booking.totalPaid || 0),
            paymentStatus: booking.paymentStatus,
            payments: booking.payments,
            createdAt: booking.createdAt,
        }));

        const totalPages = Math.ceil(totalBookings / limit);

        return {
            payments: paymentsData,
            pagination: {
                totalBookings,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }

    /**
     * Add payment to a facility booking
     * @param {string} bookingId - Facility Booking ID
     * @param {Object} paymentData - Payment data
     * @param {Object} currentUser - Current user
     * @returns {Object} Updated booking
     */
    async addFacilityPayment(bookingId, paymentData, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        // Validate payment data
        const { amount, paymentMethod, transactionId, notes } = paymentData;

        if (!amount || amount <= 0) {
            throw new Error("Payment amount must be greater than 0");
        }

        if (!paymentMethod || !["card", "cash"].includes(paymentMethod)) {
            throw new Error("Payment method must be either 'card' or 'cash'");
        }

        // Find facility booking
        const booking = await PublicFacilityBooking.findById(bookingId)
            .populate("facility", "name facilityType pricePerHour pricePerDay")
            .populate("guest", "name email");

        if (!booking) {
            throw new Error("Facility booking not found");
        }

        // Authorization check
        if (currentUser.role === "guest") {
            if (!booking.guest || booking.guest._id.toString() !== currentUser.id) {
                throw new Error("You can only add payments to your own bookings");
            }
        } else if (currentUser.role !== "receptionist" && currentUser.role !== "admin") {
            throw new Error("Unauthorized to add payments");
        }

        // Check if booking is cancelled
        if (booking.status === "cancelled") {
            throw new Error("Cannot add payment to a cancelled booking");
        }

        // Check if payment exceeds remaining balance
        const remainingBalance = booking.totalAmount - (booking.totalPaid || 0);

        if (amount > remainingBalance) {
            throw new Error(`Payment amount (${amount}) exceeds remaining balance (${remainingBalance})`);
        }

        // Create payment record
        const payment = {
            amount,
            paymentMethod,
            paymentDate: new Date(),
            processedBy: currentUser.id,
            transactionId: transactionId || null,
            notes: notes || null,
        };

        // Add payment to booking
        booking.payments.push(payment);
        booking.totalPaid = (booking.totalPaid || 0) + amount;

        // Update payment status
        this.updatePaymentStatus(booking);

        await booking.save();

        // Populate the processedBy field for the new payment
        await booking.populate("payments.processedBy", "name email role");

        return booking.toJSON();
    }

    /**
     * Get all payments for a facility booking
     * @param {string} bookingId - Facility Booking ID
     * @param {Object} currentUser - Current user
     * @returns {Object} Booking with payments
     */
    async getFacilityBookingPayments(bookingId, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        const booking = await PublicFacilityBooking.findById(bookingId)
            .populate("facility", "name facilityType pricePerHour pricePerDay")
            .populate("guest", "name email")
            .populate("payments.processedBy", "name email role");

        if (!booking) {
            throw new Error("Facility booking not found");
        }

        // Authorization check
        if (currentUser.role === "guest") {
            if (!booking.guest || booking.guest._id.toString() !== currentUser.id) {
                throw new Error("You can only view payments for your own bookings");
            }
        } else if (currentUser.role === "receptionist") {
            if (currentUser.hotelId && booking.hotelId.toString() !== currentUser.hotelId.toString()) {
                throw new Error("You can only view payments for bookings in your hotel");
            }
        } else if (currentUser.role !== "admin") {
            throw new Error("Unauthorized to view payments");
        }

        return {
            bookingId: booking._id,
            bookingStatus: booking.status,
            facility: booking.facility,
            guest: booking.guest,
            customerDetails: booking.customerDetails,
            startDate: booking.startDate,
            endDate: booking.endDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            facilityCharges: booking.facilityCharges,
            serviceCharges: booking.serviceCharges,
            totalAmount: booking.totalAmount,
            totalPaid: booking.totalPaid,
            balance: booking.totalAmount - (booking.totalPaid || 0),
            paymentStatus: booking.paymentStatus,
            payments: booking.payments,
        };
    }

    /**
     * Get balance for a facility booking
     * @param {string} bookingId - Facility Booking ID
     * @param {Object} currentUser - Current user
     * @returns {Object} Balance information
     */
    async getFacilityBookingBalance(bookingId, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            throw new Error("Invalid booking ID");
        }

        const booking = await PublicFacilityBooking.findById(bookingId)
            .populate("facility", "name facilityType pricePerHour pricePerDay")
            .populate("guest", "name email");

        if (!booking) {
            throw new Error("Facility booking not found");
        }

        // Authorization check
        if (currentUser.role === "guest") {
            if (!booking.guest || booking.guest._id.toString() !== currentUser.id) {
                throw new Error("You can only view balance for your own bookings");
            }
        } else if (currentUser.role === "receptionist") {
            if (currentUser.hotelId && booking.hotelId.toString() !== currentUser.hotelId.toString()) {
                throw new Error("You can only view balance for bookings in your hotel");
            }
        } else if (currentUser.role !== "admin") {
            throw new Error("Unauthorized to view balance");
        }

        const balance = booking.totalAmount - (booking.totalPaid || 0);

        return {
            bookingId: booking._id,
            facilityCharges: booking.facilityCharges,
            serviceCharges: booking.serviceCharges,
            totalAmount: booking.totalAmount,
            totalPaid: booking.totalPaid,
            balance,
            paymentStatus: booking.paymentStatus,
        };
    }
}

export default new PaymentService();
