import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
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
            validate: {
                validator: async function (bookingId) {
                    const Booking = mongoose.model("Booking");
                    const booking = await Booking.findById(bookingId);
                    return booking !== null;
                },
                message: "Booking does not exist",
            },
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: [true, "Room is required"],
            validate: {
                validator: async function (roomId) {
                    const Room = mongoose.model("Room");
                    const room = await Room.findById(roomId);
                    return room !== null;
                },
                message: "Room does not exist",
            },
        },
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Requested by is required"],
            validate: {
                validator: async function (userId) {
                    const User = mongoose.model("User");
                    const user = await User.findById(userId);
                    return user !== null;
                },
                message: "User does not exist",
            },
        },
        serviceType: {
            type: String,
            required: [true, "Service type is required"],
            enum: {
                values: [
                    "cleaning",
                    "housekeeping",
                    "maintenance",
                    "room_service",
                    "food_service",
                    "medical_assistance",
                    "massage",
                    "gym_access",
                    "yoga_session",
                    "laundry",
                    "spa",
                    "transport",
                    "room_decoration",
                    "other",
                ],
                message: "{VALUE} is not a valid service type",
            },
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        fixedPrice: {
            type: Number,
            required: false, // Will be populated from service catalog
            min: [0, "Price cannot be negative"],
        },
        finalPrice: {
            type: Number,
            required: false, // Set when service is completed
            min: [0, "Price cannot be negative"],
        },
        status: {
            type: String,
            enum: {
                values: ["pending", "in_progress", "completed"],
                message: "{VALUE} is not a valid status",
            },
            default: "pending",
        },
        assignedRole: {
            type: String,
            enum: {
                values: ["housekeeping", "maintenance", "none"],
                message: "{VALUE} is not a valid assigned role",
            },
            default: "none",
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            validate: {
                validator: async function (userId) {
                    if (!userId) return true;
                    const User = mongoose.model("User");
                    const user = await User.findById(userId);
                    return user !== null;
                },
                message: "Assigned user does not exist",
            },
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        priority: {
            type: String,
            enum: {
                values: ["low", "normal", "high", "urgent"],
                message: "{VALUE} is not a valid priority",
            },
            default: "normal",
        },
        completedAt: {
            type: Date,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
serviceRequestSchema.index({ hotelId: 1 });
serviceRequestSchema.index({ hotelId: 1, booking: 1 });
serviceRequestSchema.index({ hotelId: 1, room: 1 });
serviceRequestSchema.index({ hotelId: 1, requestedBy: 1 });
serviceRequestSchema.index({ hotelId: 1, status: 1 });
serviceRequestSchema.index({ hotelId: 1, assignedRole: 1 });
serviceRequestSchema.index({ hotelId: 1, serviceType: 1 });
serviceRequestSchema.index({ hotelId: 1, assignedTo: 1 });

// Compound index for filtering by status and assigned role (hotel-scoped)
serviceRequestSchema.index({ hotelId: 1, status: 1, assignedRole: 1 });

// Compound index for filtering by assignedTo and status (hotel-scoped)
serviceRequestSchema.index({ hotelId: 1, assignedTo: 1, status: 1 });

// Pre-save hook to automatically assign role based on service type and set completedAt
serviceRequestSchema.pre("save", function () {
    // Only assign role automatically on creation or if serviceType changed
    if (this.isNew || this.isModified("serviceType")) {
        // Automatic assignment logic
        if (this.serviceType === "cleaning" || this.serviceType === "housekeeping" || this.serviceType === "room_service" || this.serviceType === "laundry") {
            this.assignedRole = "housekeeping";
        } else if (this.serviceType === "maintenance") {
            this.assignedRole = "maintenance";
        } else {
            // Other service types don't require specific staff assignment
            this.assignedRole = "none";
        }
    }

    // Set completedAt when status changes to completed
    if (this.isModified("status") && this.status === "completed" && !this.completedAt) {
        this.completedAt = new Date();
    }
});

// Instance method to get service request as JSON (excluding __v)
serviceRequestSchema.methods.toJSON = function () {
    const serviceRequest = this.toObject();
    delete serviceRequest.__v;
    return serviceRequest;
};

const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);

export default ServiceRequest;

