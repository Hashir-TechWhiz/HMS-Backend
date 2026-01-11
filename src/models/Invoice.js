import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
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
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: [true, "Booking is required"],
            unique: true, // One invoice per booking
            validate: {
                validator: async function (bookingId) {
                    const Booking = mongoose.model("Booking");
                    const booking = await Booking.findById(bookingId);
                    return booking !== null;
                },
                message: "Booking does not exist",
            },
        },
        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Walk-in bookings may not have a guest user
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
        roomCharges: {
            roomId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Room",
                required: true,
            },
            roomNumber: {
                type: String,
                required: true,
            },
            roomType: {
                type: String,
                required: true,
            },
            pricePerNight: {
                type: Number,
                required: true,
                min: [0, "Price per night cannot be negative"],
            },
            numberOfNights: {
                type: Number,
                required: true,
                min: [1, "Number of nights must be at least 1"],
            },
            totalRoomCharges: {
                type: Number,
                required: true,
                min: [0, "Total room charges cannot be negative"],
            },
        },
        serviceCharges: [
            {
                serviceRequestId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "ServiceRequest",
                    required: true,
                },
                serviceType: {
                    type: String,
                    required: true,
                },
                description: {
                    type: String,
                    default: "",
                },
                price: {
                    type: Number,
                    required: true,
                    min: [0, "Service price cannot be negative"],
                },
                completedAt: {
                    type: Date,
                    required: true,
                },
            },
        ],
        subtotal: {
            type: Number,
            required: true,
            min: [0, "Subtotal cannot be negative"],
        },
        tax: {
            type: Number,
            default: 0,
            min: [0, "Tax cannot be negative"],
        },
        totalAmount: {
            type: Number,
            required: true,
            min: [0, "Total amount cannot be negative"],
        },
        paymentStatus: {
            type: String,
            enum: {
                values: ["pending", "paid", "partially_paid"],
                message: "{VALUE} is not a valid payment status",
            },
            default: "pending",
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: [0, "Paid amount cannot be negative"],
        },
        generatedAt: {
            type: Date,
            default: Date.now,
        },
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
invoiceSchema.index({ hotelId: 1 });
invoiceSchema.index({ hotelId: 1, booking: 1 });
invoiceSchema.index({ hotelId: 1, guest: 1 });
invoiceSchema.index({ hotelId: 1, paymentStatus: 1 });
invoiceSchema.index({ hotelId: 1, generatedAt: 1 });

// Compound index for hotel-scoped invoice queries
invoiceSchema.index({ hotelId: 1, paymentStatus: 1, generatedAt: -1 });

// Instance method to get invoice as JSON (excluding __v)
invoiceSchema.methods.toJSON = function () {
    const invoice = this.toObject();
    delete invoice.__v;
    return invoice;
};

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
