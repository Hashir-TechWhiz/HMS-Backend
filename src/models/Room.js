import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        roomNumber: {
            type: String,
            required: [true, "Room number is required"],
            unique: true,
            trim: true,
        },
        roomType: {
            type: String,
            required: [true, "Room type is required"],
            enum: {
                values: ["Single", "Double", "Suite", "Deluxe", "Presidential"],
                message: "{VALUE} is not a valid room type",
            },
        },
        pricePerNight: {
            type: Number,
            required: [true, "Price per night is required"],
            min: [0, "Price per night cannot be negative"],
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
        description: {
            type: String,
            trim: true,
            default: "",
        },
        amenities: {
            type: [String],
            default: [],
            validate: {
                validator: function (amenities) {
                    // Optional field - empty array is valid
                    if (!amenities || amenities.length === 0) return true;

                    // Validate that all amenities are from the allowed list
                    const allowedAmenities = [
                        "Wi-Fi",
                        "Air Conditioning",
                        "TV",
                        "Mini Bar",
                        "Room Service",
                        "Balcony",
                        "Sea View",
                        "Safe Locker"
                    ];
                    return amenities.every((amenity) => allowedAmenities.includes(amenity));
                },
                message: "Invalid amenity selected",
            },
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

// Index for faster queries
// Note: roomNumber already has an index via unique: true
roomSchema.index({ status: 1 });
roomSchema.index({ roomType: 1 });

// Instance method to get room as JSON (excluding __v)
roomSchema.methods.toJSON = function () {
    const room = this.toObject();
    delete room.__v;
    return room;
};

const Room = mongoose.model("Room", roomSchema);

export default Room;

