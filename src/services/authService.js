import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import transporter from "../config/nodemailer.js";
import { resetOtpEmailTemplate } from "../templates/resetOtpEmailTemplate.js";

class AuthService {
    /**
     * Generate JWT token for a user
     */
    generateToken(user) {
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        });

        return token;
    }

    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error("Invalid or expired token");
        }
    }

    /**
     * Login user with email and password
     * @returns {Object} User and token
     */
    async login(email, password) {
        // Validate input
        if (!email || !password) {
            throw new Error("Email and password are required");
        }

        // Find user by email and include password field
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            throw new Error("Invalid email");
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Error("Account is deactivated");
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }

        // Generate token
        const token = this.generateToken(user);

        // Remove password from user object
        const userObject = user.toJSON();

        return {
            user: userObject,
            token,
        };
    }

    /**
     * Register a new guest user (Public self-registration)
     * @param {Object} userData - User data (name, email, password)
     * @returns {Object} Created user
     */
    async registerGuest(userData) {
        // Validate required fields
        const { name, email, password } = userData;

        if (!name || !email || !password) {
            throw new Error("Name, email, and password are required");
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        // Create new guest user (role is always "guest" for self-registration)
        const newUser = new User({
            name,
            email,
            password,
            role: "guest", // Always guest for self-registration
            isActive: true, // Default to active
        });

        await newUser.save();

        // Return user without password
        return newUser.toJSON();
    }

    /**
     * Create a new user (Admin only operation)
     * @param {Object} userData - User data
     * @param {string} requesterId - ID of the user making the request
     * @returns {Object} Created user
     */
    async createUser(userData, requesterId) {
        // Validate requester is admin (double check at service level)
        const requester = await User.findById(requesterId);

        if (!requester || requester.role !== "admin") {
            throw new Error("Unauthorized: Only admins can create users");
        }

        // Validate required fields
        const { name, email, password, role, hotelId } = userData;

        if (!name || !email || !password) {
            throw new Error("Name, email, and password are required");
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        // Validate role
        const validRoles = ["guest", "receptionist", "housekeeping", "admin"];
        if (role && !validRoles.includes(role)) {
            throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
        }

        // Validate hotelId for staff roles
        const finalRole = role || "guest";
        if ((finalRole === "receptionist" || finalRole === "housekeeping") && !hotelId) {
            throw new Error("Hotel assignment is required for receptionist and housekeeping staff");
        }

        // Create new user
        const newUserData = {
            name,
            email,
            password,
            role: finalRole,
            isActive: userData.isActive !== undefined ? userData.isActive : true,
        };

        // Add hotelId if provided
        if (hotelId) {
            newUserData.hotelId = hotelId;
        }

        const newUser = new User(newUserData);

        await newUser.save();

        // Return user without password
        return newUser.toJSON();
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Object} User object
     */
    async getUserById(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        return user.toJSON();
    }

    /**
     * Update user profile
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Object} Updated user
     */
    async updateUser(userId, updateData) {
        // Prevent updating sensitive fields directly
        const allowedUpdates = ["name", "email"];
        const updates = {};

        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                updates[key] = updateData[key];
            }
        }

        const user = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user.toJSON();
    }

    /**
     * Generate a secure 6-digit OTP
     * @returns {string} 6-digit OTP
     */
    generateOTP() {
        // Generate a random 6-digit number
        return crypto.randomInt(100000, 999999).toString();
    }

    /**
     * Send OTP email to user
     * @param {string} email - User's email
     * @param {string} otp - OTP code
     * @param {string} name - User's name
     */
    async sendOTPEmail(email, otp, name) {
        const mailOptions = {
            from: `"Hotel Management System" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Password Reset OTP",
            html: resetOtpEmailTemplate(name, otp),
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (error) {
            throw new Error("Failed to send OTP email");
        }
    }

    /**
     * Initiate forgot password process
     * @param {string} email - User's email
     * @returns {Object} Success message
     */
    async forgotPassword(email) {
        if (!email) {
            throw new Error("Email is required");
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        // Check if user exists
        if (!user) {
            throw new Error("No account found with this email address");
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Error("Account is deactivated. Please contact support.");
        }

        // Generate OTP
        const otp = this.generateOTP();

        // Set OTP expiry (15 minutes from now)
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

        // Save OTP and expiry to user
        user.resetOtp = otp;
        user.resetOtpExpireAt = otpExpiry;
        await user.save();

        // Send OTP email
        try {
            await this.sendOTPEmail(user.email, otp, user.name);
        } catch (error) {
            // Clear OTP if email fails
            user.resetOtp = null;
            user.resetOtpExpireAt = null;
            await user.save();
            throw new Error("Failed to send OTP email. Please try again later.");
        }

        return {
            message: "OTP has been sent to your email address.",
        };
    }

    /**
     * Verify reset OTP
     * @param {string} email - User's email
     * @param {string} otp - OTP to verify
     * @returns {Object} Success message
     */
    async verifyResetOtp(email, otp) {
        if (!email || !otp) {
            throw new Error("Email and OTP are required");
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            throw new Error("Invalid OTP or email");
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Error("Account is deactivated");
        }

        // Check if OTP exists
        if (!user.resetOtp || !user.resetOtpExpireAt) {
            throw new Error("Invalid OTP or email");
        }

        // Check if OTP matches
        if (user.resetOtp !== otp) {
            throw new Error("Invalid OTP");
        }

        // Check if OTP is expired
        if (new Date() > user.resetOtpExpireAt) {
            // Clear expired OTP
            user.resetOtp = null;
            user.resetOtpExpireAt = null;
            await user.save();
            throw new Error("OTP has expired. Please request a new one.");
        }

        return {
            message: "OTP verified successfully. You may now reset your password.",
        };
    }

    /**
     * Reset password using OTP
     * @param {string} email - User's email
     * @param {string} otp - OTP
     * @param {string} newPassword - New password
     * @returns {Object} Success message
     */
    async resetPassword(email, otp, newPassword) {
        if (!email || !otp || !newPassword) {
            throw new Error("Email, OTP, and new password are required");
        }

        // Validate password length
        if (newPassword.length < 6) {
            throw new Error("Password must be at least 6 characters long");
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            throw new Error("Invalid OTP or email");
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Error("Account is deactivated");
        }

        // Check if OTP exists
        if (!user.resetOtp || !user.resetOtpExpireAt) {
            throw new Error("Invalid OTP or email");
        }

        // Check if OTP matches
        if (user.resetOtp !== otp) {
            throw new Error("Invalid OTP or email");
        }

        // Check if OTP is expired
        if (new Date() > user.resetOtpExpireAt) {
            // Clear expired OTP
            user.resetOtp = null;
            user.resetOtpExpireAt = null;
            await user.save();
            throw new Error("OTP has expired. Please request a new one.");
        }

        // Update password and clear OTP fields
        user.password = newPassword;
        user.resetOtp = null;
        user.resetOtpExpireAt = null;

        // The pre-save hook will hash the password automatically
        await user.save();

        return {
            message: "Password reset successfully. You can now login with your new password.",
        };
    }
}

export default new AuthService();

