import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
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
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: [true, "Room is required"],
        },
        checkInDate: {
            type: Date,
            required: [true, "Check-in date is required"],
            validate: {
                validator: function (value) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return value >= today;
                },
                message: "Check-in date cannot be in the past",
            },
        },
        checkOutDate: {
            type: Date,
            required: [true, "Check-out date is required"],
            validate: {
                validator: function (value) {
                    return value > this.checkInDate;
                },
                message: "Check-out date must be after check-in date",
            },
        },
        status: {
            type: String,
            enum: {
                values: ["pending", "confirmed", "checkedin", "completed", "cancelled"],
                message: "{VALUE} is not a valid status",
            },
            default: "pending",
        },
        // Cancellation penalty fields (for staff-managed cancellations)
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
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
bookingSchema.index({ guest: 1 });
bookingSchema.index({ room: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ createdBy: 1 });

// Compound index for checking overlapping bookings
bookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1, status: 1 });

// Pre-save hook to check for overlapping bookings
bookingSchema.pre("save", async function () {
    // Only check for overlaps if this is a new booking or if dates/room changed
    if (this.isNew || this.isModified("checkInDate") || this.isModified("checkOutDate") || this.isModified("room")) {
        const Booking = mongoose.model("Booking");

        const overlappingBooking = await Booking.findOne({
            _id: { $ne: this._id }, // Exclude current booking
            room: this.room,
            status: { $ne: "cancelled" }, // Only check non-cancelled bookings
            $or: [
                // New booking starts during an existing booking
                {
                    checkInDate: { $lte: this.checkInDate },
                    checkOutDate: { $gt: this.checkInDate },
                },
                // New booking ends during an existing booking
                {
                    checkInDate: { $lt: this.checkOutDate },
                    checkOutDate: { $gte: this.checkOutDate },
                },
                // New booking completely contains an existing booking
                {
                    checkInDate: { $gte: this.checkInDate },
                    checkOutDate: { $lte: this.checkOutDate },
                },
            ],
        });

        if (overlappingBooking) {
            throw new Error("Room is already booked for the selected dates");
        }
    }
});

// Instance method to get booking as JSON (excluding __v)
bookingSchema.methods.toJSON = function () {
    const booking = this.toObject();
    delete booking.__v;
    return booking;
};

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;

