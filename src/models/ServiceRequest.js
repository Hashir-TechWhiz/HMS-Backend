import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
    {
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
                values: ["housekeeping", "maintenance", "room_service"],
                message: "{VALUE} is not a valid service type",
            },
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
                values: ["housekeeping", "maintenance"],
                message: "{VALUE} is not a valid assigned role",
            },
            // Not required here because it's automatically set by pre-save hook
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
serviceRequestSchema.index({ booking: 1 });
serviceRequestSchema.index({ room: 1 });
serviceRequestSchema.index({ requestedBy: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ assignedRole: 1 });
serviceRequestSchema.index({ serviceType: 1 });

// Compound index for filtering by status and assigned role
serviceRequestSchema.index({ status: 1, assignedRole: 1 });

// Pre-save hook to automatically assign role based on service type
serviceRequestSchema.pre("save", function () {
    // Only assign role automatically on creation or if serviceType changed
    if (this.isNew || this.isModified("serviceType")) {
        // Automatic assignment logic
        if (this.serviceType === "housekeeping" || this.serviceType === "room_service") {
            this.assignedRole = "housekeeping";
        } else if (this.serviceType === "maintenance") {
            this.assignedRole = "maintenance";
        }
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

