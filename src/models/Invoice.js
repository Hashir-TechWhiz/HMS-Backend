import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: [true, "Invoice number is required"],
            trim: true,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: [true, "Booking is required"],
        },
        hotelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hotel",
            required: [true, "Hotel is required"],
        },
        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Walk-in bookings might not have a guest user
        },
        // Guest/Customer details (captured at time of invoice generation)
        guestDetails: {
            name: {
                type: String,
                required: [true, "Guest name is required"],
                trim: true,
            },
            email: {
                type: String,
                required: [true, "Guest email is required"],
                trim: true,
                lowercase: true,
            },
            phone: {
                type: String,
                required: false,
                trim: true,
            },
        },
        // Hotel details (captured at time of invoice generation)
        hotelDetails: {
            name: {
                type: String,
                required: [true, "Hotel name is required"],
            },
            address: {
                type: String,
                required: [true, "Hotel address is required"],
            },
            city: {
                type: String,
                required: [true, "Hotel city is required"],
            },
            country: {
                type: String,
                required: [true, "Hotel country is required"],
            },
            contactEmail: {
                type: String,
                required: [true, "Hotel contact email is required"],
            },
            contactPhone: {
                type: String,
                required: [true, "Hotel contact phone is required"],
            },
        },
        // Stay details
        stayDetails: {
            roomNumber: {
                type: String,
                required: [true, "Room number is required"],
            },
            roomType: {
                type: String,
                required: [true, "Room type is required"],
            },
            checkInDate: {
                type: Date,
                required: [true, "Check-in date is required"],
            },
            checkOutDate: {
                type: Date,
                required: [true, "Check-out date is required"],
            },
            numberOfNights: {
                type: Number,
                required: [true, "Number of nights is required"],
                min: [1, "Number of nights must be at least 1"],
            },
        },
        // Room charges
        roomCharges: {
            pricePerNight: {
                type: Number,
                required: [true, "Price per night is required"],
                min: [0, "Price per night cannot be negative"],
            },
            numberOfNights: {
                type: Number,
                required: [true, "Number of nights is required"],
                min: [1, "Number of nights must be at least 1"],
            },
            subtotal: {
                type: Number,
                required: [true, "Room charges subtotal is required"],
                min: [0, "Subtotal cannot be negative"],
            },
        },
        // Service charges (array of line items)
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
                quantity: {
                    type: Number,
                    default: 1,
                    min: [1, "Quantity must be at least 1"],
                },
                unitPrice: {
                    type: Number,
                    required: true,
                    min: [0, "Unit price cannot be negative"],
                },
                total: {
                    type: Number,
                    required: true,
                    min: [0, "Total cannot be negative"],
                },
            },
        ],
        // Financial summary
        summary: {
            roomChargesTotal: {
                type: Number,
                required: [true, "Room charges total is required"],
                min: [0, "Room charges total cannot be negative"],
            },
            serviceChargesTotal: {
                type: Number,
                required: [true, "Service charges total is required"],
                min: [0, "Service charges total cannot be negative"],
                default: 0,
            },
            subtotal: {
                type: Number,
                required: [true, "Subtotal is required"],
                min: [0, "Subtotal cannot be negative"],
            },
            tax: {
                type: Number,
                default: 0,
                min: [0, "Tax cannot be negative"],
            },
            grandTotal: {
                type: Number,
                required: [true, "Grand total is required"],
                min: [0, "Grand total cannot be negative"],
            },
        },
        // Payment status
        paymentStatus: {
            type: String,
            enum: {
                values: ["pending", "paid", "partially_paid", "refunded"],
                message: "{VALUE} is not a valid payment status",
            },
            default: "paid", // Invoices are generated at checkout, so payment should be complete
        },
        // Metadata
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // System-generated or staff-generated
        },
        pdfPath: {
            type: String,
            required: false, // Path to generated PDF file (if stored on server)
        },
        emailSent: {
            type: Boolean,
            default: false,
        },
        emailSentAt: {
            type: Date,
            required: false,
        },
        notes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ booking: 1 });
invoiceSchema.index({ hotelId: 1 });
invoiceSchema.index({ guest: 1 });
invoiceSchema.index({ "guestDetails.email": 1 });
invoiceSchema.index({ createdAt: -1 });

// Instance method to get invoice as JSON (excluding __v)
invoiceSchema.methods.toJSON = function () {
    const invoice = this.toObject();
    delete invoice.__v;
    return invoice;
};

// Static method to generate unique invoice number
invoiceSchema.statics.generateInvoiceNumber = async function () {
    const prefix = "INV";
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    // Find the last invoice for this month
    const lastInvoice = await this.findOne({
        invoiceNumber: new RegExp(`^${prefix}-${year}${month}-`),
    })
        .sort({ invoiceNumber: -1 })
        .limit(1);

    let sequence = 1;
    if (lastInvoice) {
        const lastSequence = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
        sequence = lastSequence + 1;
    }

    const sequenceStr = String(sequence).padStart(5, "0");
    return `${prefix}-${year}${month}-${sequenceStr}`;
};

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
