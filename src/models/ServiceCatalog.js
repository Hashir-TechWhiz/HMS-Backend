import mongoose from "mongoose";

const serviceCatalogSchema = new mongoose.Schema(
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
        serviceType: {
            type: String,
            required: [true, "Service type is required"],
            enum: {
                values: [
                    "cleaning",
                    "housekeeping",
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
                    "maintenance",
                    "other",
                ],
                message: "{VALUE} is not a valid service type",
            },
        },
        displayName: {
            type: String,
            required: [true, "Display name is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        fixedPrice: {
            type: Number,
            required: function () {
                // Fixed price is required for all services except "other"
                return this.serviceType !== "other";
            },
            min: [0, "Price cannot be negative"],
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

// Indexes for faster queries
serviceCatalogSchema.index({ hotelId: 1 });
serviceCatalogSchema.index({ hotelId: 1, isActive: 1 });

// Compound unique index - one service type per hotel (also covers hotelId + serviceType queries)
serviceCatalogSchema.index({ hotelId: 1, serviceType: 1 }, { unique: true });

// Instance method to get service catalog as JSON (excluding __v)
serviceCatalogSchema.methods.toJSON = function () {
    const serviceCatalog = this.toObject();
    delete serviceCatalog.__v;
    return serviceCatalog;
};

const ServiceCatalog = mongoose.model("ServiceCatalog", serviceCatalogSchema);

export default ServiceCatalog;
