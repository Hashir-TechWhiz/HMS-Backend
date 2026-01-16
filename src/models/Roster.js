import mongoose from "mongoose";

/**
 * Roster Schema
 * Manages staff shift assignments per hotel
 */
const rosterSchema = new mongoose.Schema(
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
        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Staff member is required"],
            validate: {
                validator: async function (staffId) {
                    const User = mongoose.model("User");
                    const user = await User.findById(staffId);
                    
                    // Must be a staff member (receptionist or housekeeping)
                    if (!user || !["receptionist", "housekeeping"].includes(user.role)) {
                        throw new Error("Only receptionist or housekeeping staff can be rostered");
                    }
                    
                    // Staff must belong to the assigned hotel
                    if (user.hotelId && user.hotelId.toString() !== this.hotelId.toString()) {
                        throw new Error("Staff member must belong to the assigned hotel");
                    }
                    
                    return true;
                },
                message: "Invalid staff assignment",
            },
        },
        date: {
            type: Date,
            required: [true, "Date is required"],
            validate: {
                validator: function (date) {
                    // Date should not be too far in the past (e.g., more than 30 days)
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return date >= thirtyDaysAgo;
                },
                message: "Date cannot be more than 30 days in the past",
            },
        },
        shiftType: {
            type: String,
            enum: {
                values: ["morning", "afternoon", "evening", "night"],
                message: "{VALUE} is not a valid shift type",
            },
            required: [true, "Shift type is required"],
        },
        shiftStartTime: {
            type: String,
            required: [true, "Shift start time is required"],
            match: [
                /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                "Shift start time must be in HH:MM format (e.g., 09:00)",
            ],
        },
        shiftEndTime: {
            type: String,
            required: [true, "Shift end time is required"],
            match: [
                /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                "Shift end time must be in HH:MM format (e.g., 17:00)",
            ],
            validate: {
                validator: function (endTime) {
                    // Basic validation: end time should be different from start time
                    return endTime !== this.shiftStartTime;
                },
                message: "Shift end time must be different from start time",
            },
        },
        role: {
            type: String,
            enum: {
                values: ["receptionist", "housekeeping"],
                message: "{VALUE} is not a valid role",
            },
            required: [true, "Role is required"],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, "Notes cannot exceed 500 characters"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
rosterSchema.index({ hotelId: 1, date: 1 });
rosterSchema.index({ staffId: 1, date: 1 });
rosterSchema.index({ hotelId: 1, staffId: 1, date: 1 });

// Unique constraint: prevent duplicate shifts for same staff on same date and overlapping times
rosterSchema.index(
    { staffId: 1, date: 1, shiftType: 1 },
    { unique: true }
);

// Instance method to get roster as JSON (excluding __v)
rosterSchema.methods.toJSON = function () {
    const roster = this.toObject();
    delete roster.__v;
    return roster;
};

// Static method to check for overlapping shifts
rosterSchema.statics.checkOverlappingShifts = async function (staffId, date, shiftType, excludeId = null) {
    // Normalize date to midnight UTC to match how MongoDB stores dates
    const inputDate = new Date(date);
    const normalizedDate = new Date(Date.UTC(
        inputDate.getUTCFullYear(),
        inputDate.getUTCMonth(),
        inputDate.getUTCDate(),
        0, 0, 0, 0
    ));
    
    const query = {
        staffId,
        date: normalizedDate,
        shiftType,
        isActive: true,
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const existingShift = await this.findOne(query);
    return existingShift !== null;
};

const Roster = mongoose.model("Roster", rosterSchema);

export default Roster;
