import mongoose from "mongoose";

const housekeepingRosterSchema = new mongoose.Schema(
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
        date: {
            type: Date,
            required: [true, "Date is required"],
        },
        session: {
            type: String,
            enum: {
                values: ["MORNING", "AFTERNOON", "EVENING"],
                message: "{VALUE} is not a valid session",
            },
            required: [true, "Session is required"],
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Can be assigned later
            validate: {
                validator: async function (userId) {
                    if (!userId) return true;
                    const User = mongoose.model("User");
                    const user = await User.findById(userId);
                    return user && user.role === "housekeeping";
                },
                message: "Assigned user must be a housekeeping staff member",
            },
        },
        status: {
            type: String,
            enum: {
                values: ["pending", "in_progress", "completed", "skipped"],
                message: "{VALUE} is not a valid status",
            },
            default: "pending",
        },
        priority: {
            type: String,
            enum: {
                values: ["low", "normal", "high", "urgent"],
                message: "{VALUE} is not a valid priority",
            },
            default: "normal",
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
        completedAt: {
            type: Date,
            required: false,
        },
        taskType: {
            type: String,
            enum: {
                values: ["routine", "checkout_cleaning"],
                message: "{VALUE} is not a valid task type",
            },
            default: "routine",
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
housekeepingRosterSchema.index({ hotelId: 1 });
housekeepingRosterSchema.index({ hotelId: 1, room: 1 });
housekeepingRosterSchema.index({ hotelId: 1, date: 1 });
housekeepingRosterSchema.index({ hotelId: 1, session: 1 });
housekeepingRosterSchema.index({ hotelId: 1, assignedTo: 1 });
housekeepingRosterSchema.index({ hotelId: 1, status: 1 });
housekeepingRosterSchema.index({ hotelId: 1, date: 1, session: 1 });

// Compound unique index - one task per room per session per day
housekeepingRosterSchema.index({ hotelId: 1, room: 1, date: 1, session: 1 }, { unique: true });

// Compound index for assigned tasks
housekeepingRosterSchema.index({ hotelId: 1, assignedTo: 1, date: 1, status: 1 });

// Pre-save hook to set completedAt when status changes to completed
housekeepingRosterSchema.pre("save", function () {
    if (this.isModified("status") && this.status === "completed" && !this.completedAt) {
        this.completedAt = new Date();
    }
});

// Instance method to get roster as JSON (excluding __v)
housekeepingRosterSchema.methods.toJSON = function () {
    const roster = this.toObject();
    delete roster.__v;
    return roster;
};

const HousekeepingRoster = mongoose.model("HousekeepingRoster", housekeepingRosterSchema);

export default HousekeepingRoster;
