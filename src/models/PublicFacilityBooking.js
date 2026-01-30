import mongoose from "mongoose";

const publicFacilityBookingSchema = new mongoose.Schema(
    {
        hotelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hotel",
            required: [true, "Hotel is required"],
            validate: {
                validator: async function (hotelId) {
                    const Hotel = mongoose.model("Hotel");
                    const hotel = await Hotel.findById(hotelId);
                    return hotel !== null;
                },
                message: "Hotel does not exist",
            },
        },
        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            validate: {
                validator: async function (guestId) {
                    if (!guestId) return true;
                    const User = mongoose.model("User");
                    const user = await User.findById(guestId);
                    return user && user.role === "guest";
                },
                message: "Guest must be a user with role 'guest'",
            },
        },
        customerDetails: {
            name: {
                type: String,
                required: false,
            },
            phone: {
                type: String,
                required: false,
            },
            email: {
                type: String,
                required: false,
            },
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        facility: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PublicFacility",
            required: [true, "Facility is required"],
        },
        bookingType: {
            type: String,
            enum: {
                values: ["hourly", "daily"],
                message: "{VALUE} is not a valid booking type",
            },
            required: [true, "Booking type is required"],
        },
        startDate: {
            type: Date,
            required: [true, "Start date is required"],
            validate: {
                validator: function (value) {
                    // Only validate date is not in past when creating new booking or modifying startDate
                    if (!this.isNew && !this.isModified('startDate')) {
                        return true;
                    }
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return value >= today;
                },
                message: "Start date cannot be in the past",
            },
        },
        endDate: {
            type: Date,
            required: [true, "End date is required"],
            validate: {
                validator: function (value) {
                    return value > this.startDate;
                },
                message: "End date must be after start date",
            },
        },
        // For hourly bookings
        startTime: {
            type: String,
            required: false,
            validate: {
                validator: function (value) {
                    if (!value) return true;
                    // Validate time format HH:MM (24-hour format)
                    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
                },
                message: "Start time must be in HH:MM format",
            },
        },
        endTime: {
            type: String,
            required: false,
            validate: {
                validator: function (value) {
                    if (!value) return true;
                    // Validate time format HH:MM (24-hour format)
                    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
                },
                message: "End time must be in HH:MM format",
            },
        },
        numberOfGuests: {
            type: Number,
            required: [true, "Number of guests is required"],
            min: [1, "Number of guests must be at least 1"],
            validate: {
                validator: Number.isInteger,
                message: "Number of guests must be an integer",
            },
        },
        purpose: {
            type: String,
            trim: true,
            default: "",
        },
        specialRequests: {
            type: String,
            trim: true,
            default: "",
        },
        status: {
            type: String,
            enum: {
                values: ["pending", "confirmed", "in_use", "completed", "cancelled"],
                message: "{VALUE} is not a valid status",
            },
            default: "pending",
        },
        // Cancellation fields
        cancellationPenalty: {
            type: Number,
            required: false,
            default: 0,
        },
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        cancellationReason: {
            type: String,
            required: false,
        },
        cancellationDate: {
            type: Date,
            required: false,
        },
        // Check-in details
        isCheckedIn: {
            type: Boolean,
            default: false,
        },
        checkInDetails: {
            checkedInAt: {
                type: Date,
                required: false,
            },
            checkedInBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: false,
            },
        },
        // Check-out details
        isCheckedOut: {
            type: Boolean,
            default: false,
        },
        checkOutDetails: {
            checkedOutAt: {
                type: Date,
                required: false,
            },
            checkedOutBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: false,
            },
        },
        // Payment tracking
        paymentStatus: {
            type: String,
            enum: {
                values: ["unpaid", "partially_paid", "paid"],
                message: "{VALUE} is not a valid payment status",
            },
            default: "unpaid",
        },
        payments: [
            {
                amount: {
                    type: Number,
                    required: true,
                    min: [0, "Payment amount cannot be negative"],
                },
                paymentMethod: {
                    type: String,
                    enum: {
                        values: ["card", "cash"],
                        message: "{VALUE} is not a valid payment method",
                    },
                    required: true,
                },
                paymentDate: {
                    type: Date,
                    default: Date.now,
                },
                processedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: false,
                },
                transactionId: {
                    type: String,
                    required: false,
                    trim: true,
                },
                notes: {
                    type: String,
                    required: false,
                    trim: true,
                },
            },
        ],
        totalPaid: {
            type: Number,
            default: 0,
            min: [0, "Total paid cannot be negative"],
        },
        facilityCharges: {
            type: Number,
            required: false,
            default: 0,
            min: [0, "Facility charges cannot be negative"],
        },
        serviceCharges: {
            type: Number,
            required: false,
            default: 0,
            min: [0, "Service charges cannot be negative"],
        },
        totalAmount: {
            type: Number,
            required: false,
            min: [0, "Total amount cannot be negative"],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
publicFacilityBookingSchema.index({ hotelId: 1 });
publicFacilityBookingSchema.index({ hotelId: 1, guest: 1 });
publicFacilityBookingSchema.index({ hotelId: 1, facility: 1 });
publicFacilityBookingSchema.index({ hotelId: 1, status: 1 });
publicFacilityBookingSchema.index({ hotelId: 1, startDate: 1, endDate: 1 });
publicFacilityBookingSchema.index({ hotelId: 1, createdBy: 1 });

// Compound index for checking overlapping bookings (hotel-scoped)
publicFacilityBookingSchema.index({ hotelId: 1, facility: 1, startDate: 1, endDate: 1, status: 1 });

// Pre-save hook to check for overlapping bookings
publicFacilityBookingSchema.pre("save", async function () {
    // Only check for overlaps if this is a new booking or if dates/facility changed
    if (this.isNew || this.isModified("startDate") || this.isModified("endDate") || this.isModified("facility") || this.isModified("startTime") || this.isModified("endTime")) {
        const PublicFacilityBooking = mongoose.model("PublicFacilityBooking");

        // Build overlap query based on booking type
        let overlapConditions = [];

        if (this.bookingType === "hourly" && this.startTime && this.endTime) {
            // For hourly bookings, check if dates and times overlap
            overlapConditions = [
                // Same day bookings with overlapping times
                {
                    startDate: { $lte: this.startDate },
                    endDate: { $gte: this.startDate },
                    $or: [
                        // Existing booking time contains new start time
                        {
                            startTime: { $lte: this.startTime },
                            endTime: { $gt: this.startTime },
                        },
                        // Existing booking time contains new end time
                        {
                            startTime: { $lt: this.endTime },
                            endTime: { $gte: this.endTime },
                        },
                        // New booking time contains existing booking
                        {
                            startTime: { $gte: this.startTime },
                            endTime: { $lte: this.endTime },
                        },
                    ],
                },
            ];
        } else {
            // For daily bookings, check date overlap only
            overlapConditions = [
                // New booking starts during an existing booking
                {
                    startDate: { $lte: this.startDate },
                    endDate: { $gt: this.startDate },
                },
                // New booking ends during an existing booking
                {
                    startDate: { $lt: this.endDate },
                    endDate: { $gte: this.endDate },
                },
                // New booking completely contains an existing booking
                {
                    startDate: { $gte: this.startDate },
                    endDate: { $lte: this.endDate },
                },
            ];
        }

        const overlappingBooking = await PublicFacilityBooking.findOne({
            _id: { $ne: this._id }, // Exclude current booking
            hotelId: this.hotelId, // Check only within the same hotel
            facility: this.facility,
            status: { $ne: "cancelled" }, // Only check non-cancelled bookings
            $or: overlapConditions,
        });

        if (overlappingBooking) {
            throw new Error("Facility is already booked for the selected date/time");
        }
    }
});

// Instance method to get booking as JSON (excluding __v)
publicFacilityBookingSchema.methods.toJSON = function () {
    const booking = this.toObject();
    delete booking.__v;
    return booking;
};

const PublicFacilityBooking = mongoose.model("PublicFacilityBooking", publicFacilityBookingSchema);

export default PublicFacilityBooking;
