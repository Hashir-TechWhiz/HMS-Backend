import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Hotel name is required"],
            trim: true,
        },
        code: {
            type: String,
            required: [true, "Hotel code is required"],
            unique: true,
            trim: true,
            uppercase: true,
            match: [
                /^HMS-\d{3}$/,
                "Hotel code must follow format HMS-XXX (e.g., HMS-001)",
            ],
        },
        address: {
            type: String,
            required: [true, "Address is required"],
            trim: true,
        },
        city: {
            type: String,
            required: [true, "City is required"],
            trim: true,
        },
        country: {
            type: String,
            required: [true, "Country is required"],
            trim: true,
        },
        contactEmail: {
            type: String,
            required: [true, "Contact email is required"],
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please provide a valid email address",
            ],
        },
        contactPhone: {
            type: String,
            required: [true, "Contact phone is required"],
            trim: true,
        },
        status: {
            type: String,
            enum: {
                values: ["Active", "Inactive"],
                message: "{VALUE} is not a valid status",
            },
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries (code already indexed via unique: true)
hotelSchema.index({ status: 1 });
hotelSchema.index({ city: 1 });

// Instance method to get hotel as JSON (excluding __v)
hotelSchema.methods.toJSON = function () {
    const hotel = this.toObject();
    delete hotel.__v;
    return hotel;
};

const Hotel = mongoose.model("Hotel", hotelSchema);

export default Hotel;
