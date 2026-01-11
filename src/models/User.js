import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please provide a valid email address",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
            select: false, // Don't include password in queries by default
        },
        role: {
            type: String,
            enum: {
                values: ["guest", "receptionist", "housekeeping", "admin"],
                message: "{VALUE} is not a valid role",
            },
            default: "guest",
            required: [true, "Role is required"],
        },
        hotelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hotel",
            required: false,
            validate: {
                validator: async function (hotelId) {
                    // Only receptionist and housekeeping need hotelId
                    if (this.role === "receptionist" || this.role === "housekeeping") {
                        if (!hotelId) {
                            throw new Error(`${this.role} must be assigned to a hotel`);
                        }
                        const Hotel = mongoose.model("Hotel");
                        const hotel = await Hotel.findById(hotelId);
                        return hotel !== null;
                    }
                    // Admin and guest don't need hotelId
                    return true;
                },
                message: "Hotel does not exist",
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        resetOtp: {
            type: String,
            default: null,
        },
        resetOtpExpireAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries on hotelId
userSchema.index({ hotelId: 1 });

// Pre-save hook to hash password before saving
userSchema.pre("save", async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) {
        return;
    }

    try {
        // Generate salt with 10 rounds
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error("Password comparison failed");
    }
};

// Instance method to get user without sensitive information
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.resetOtp;
    delete user.resetOtpExpireAt;
    delete user.__v;
    return user;
};

const User = mongoose.model("User", userSchema);

export default User;
