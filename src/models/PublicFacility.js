import mongoose from "mongoose";

const publicFacilitySchema = new mongoose.Schema(
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
        name: {
            type: String,
            required: [true, "Facility name is required"],
            trim: true,
        },
        facilityType: {
            type: String,
            required: [true, "Facility type is required"],
            enum: {
                values: ["Event Hall", "Pool", "Gym", "Spa", "Conference Room", "Sports Court", "Game Room", "Other"],
                message: "{VALUE} is not a valid facility type",
            },
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        capacity: {
            type: Number,
            required: [true, "Capacity is required"],
            min: [1, "Capacity must be at least 1"],
            validate: {
                validator: Number.isInteger,
                message: "Capacity must be an integer",
            },
        },
        pricePerHour: {
            type: Number,
            required: false,
            min: [0, "Price per hour cannot be negative"],
        },
        pricePerDay: {
            type: Number,
            required: false,
            min: [0, "Price per day cannot be negative"],
        },
        amenities: {
            type: [String],
            default: [],
        },
        images: {
            type: [String],
            required: [true, "At least one image is required"],
            validate: [
                {
                    validator: function (images) {
                        return images && images.length >= 1;
                    },
                    message: "At least one image URL is required",
                },
                {
                    validator: function (images) {
                        return images && images.length <= 4;
                    },
                    message: "Maximum of 4 image URLs allowed",
                },
                {
                    validator: function (images) {
                        // Validate that all images are valid URLs
                        const urlPattern = /^https?:\/\/.+/i;
                        return images.every((url) => urlPattern.test(url));
                    },
                    message: "All images must be valid URLs",
                },
            ],
        },
        operatingHours: {
            open: {
                type: String,
                required: false,
                validate: {
                    validator: function (value) {
                        // Validate time format HH:MM (24-hour format) only if value is provided
                        if (!value) return true;
                        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
                    },
                    message: "Operating open time must be in HH:MM format",
                },
            },
            close: {
                type: String,
                required: false,
                validate: {
                    validator: function (value) {
                        // Validate time format HH:MM (24-hour format) only if value is provided
                        if (!value) return true;
                        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
                    },
                    message: "Operating close time must be in HH:MM format",
                },
            },
        },
        status: {
            type: String,
            enum: {
                values: ["available", "unavailable", "maintenance"],
                message: "{VALUE} is not a valid status",
            },
            default: "available",
        },
    },
    {
        timestamps: true,
    }
);

// Compound index: name must be unique per hotel
publicFacilitySchema.index({ hotelId: 1, name: 1 }, { unique: true });
publicFacilitySchema.index({ hotelId: 1, status: 1 });
publicFacilitySchema.index({ hotelId: 1, facilityType: 1 });
publicFacilitySchema.index({ hotelId: 1 });

// Instance method to get facility as JSON (excluding __v)
publicFacilitySchema.methods.toJSON = function () {
    const facility = this.toObject();
    delete facility.__v;
    return facility;
};

const PublicFacility = mongoose.model("PublicFacility", publicFacilitySchema);

export default PublicFacility;
