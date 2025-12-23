import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
        const { name, email, password, role } = userData;

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

        // Create new user
        const newUser = new User({
            name,
            email,
            password,
            role: role || "guest", // Default to guest if not specified
            isActive: userData.isActive !== undefined ? userData.isActive : true,
        });

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
}

export default new AuthService();

