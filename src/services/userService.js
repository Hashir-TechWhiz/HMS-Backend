import User from "../models/User.js";

/**
 * User Service
 * Handles business logic for user management operations
 */

/**
 * Get all users with optional filtering and pagination
 * @param {Object} filters - Filter criteria (role, isActive)
 * @param {Object} pagination - Pagination options (page, limit)
 * @returns {Object} Users array and pagination info
 */
const getAllUsers = async (filters = {}, pagination = {}) => {
    try {
        const { role, isActive } = filters;
        const { page = 1, limit = 10 } = pagination;

        // Build query
        const query = {};

        if (role) {
            // Validate role
            const validRoles = ["guest", "receptionist", "housekeeping", "admin"];
            if (!validRoles.includes(role)) {
                throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
            }
            query.role = role;
        }

        if (isActive !== undefined) {
            // Convert string to boolean if needed
            query.isActive = isActive === "true" || isActive === true;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const limitNum = parseInt(limit, 10);

        // Execute query
        const users = await User.find(query)
            .select("-password -resetOtp -resetOtpExpireAt -__v")
            .populate("hotelId", "name code city country")
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 });

        // Get total count for pagination
        const total = await User.countDocuments(query);

        return {
            users,
            pagination: {
                page: parseInt(page, 10),
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object} User object
 */
const getUserById = async (userId) => {
    try {
        const user = await User.findById(userId).select(
            "-password -resetOtp -resetOtpExpireAt -__v"
        );

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    } catch (error) {
        throw error;
    }
};

/**
 * Update user status (activate/deactivate)
 * @param {string} userId - User ID to update
 * @param {boolean} isActive - New status
 * @param {Object} currentUser - Currently authenticated admin user
 * @returns {Object} Updated user
 */
const updateUserStatus = async (userId, isActive, currentUser) => {
    try {
        // Check if admin is trying to deactivate their own account
        if (userId === currentUser.id && !isActive) {
            throw new Error("You cannot deactivate your own account");
        }

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        // Update status
        user.isActive = isActive;
        await user.save();

        // Return user without sensitive fields
        return await User.findById(userId).select(
            "-password -resetOtp -resetOtpExpireAt -__v"
        );
    } catch (error) {
        throw error;
    }
};

/**
 * Update user details (name, role, isActive)
 * @param {string} userId - User ID to update
 * @param {Object} updateData - Data to update
 * @param {Object} currentUser - Currently authenticated admin user
 * @returns {Object} Updated user
 */
const updateUser = async (userId, updateData, currentUser) => {
    try {
        // Check if admin is trying to deactivate their own account
        if (userId === currentUser.id && updateData.isActive === false) {
            throw new Error("You cannot deactivate your own account");
        }

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        // Only allow specific fields to be updated
        const allowedFields = ["name", "role", "isActive", "hotelId"];
        const updates = {};

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                // Validate role if being updated
                if (field === "role") {
                    const validRoles = ["guest", "receptionist", "housekeeping", "admin"];
                    if (!validRoles.includes(updateData[field])) {
                        throw new Error(
                            `Invalid role. Must be one of: ${validRoles.join(", ")}`
                        );
                    }
                }
                updates[field] = updateData[field];
            }
        }

        // Validate hotelId requirement for staff roles
        const finalRole = updates.role || user.role;
        if ((finalRole === "receptionist" || finalRole === "housekeeping")) {
            const finalHotelId = updates.hotelId !== undefined ? updates.hotelId : user.hotelId;
            if (!finalHotelId) {
                throw new Error("Hotel assignment is required for receptionist and housekeeping staff");
            }
        }

        // Prevent empty updates
        if (Object.keys(updates).length === 0) {
            throw new Error("No valid fields to update");
        }

        // Update user
        Object.assign(user, updates);
        await user.save();

        // Return user without sensitive fields
        return await User.findById(userId).select(
            "-password -resetOtp -resetOtpExpireAt -__v"
        );
    } catch (error) {
        throw error;
    }
};

/**
 * Get user statistics
 * @returns {Object} User statistics
 */
const getUserStatistics = async () => {
    try {
        const total = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = await User.countDocuments({ isActive: false });

        const roleBreakdown = await User.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 },
                },
            },
        ]);

        const statistics = {
            total,
            activeUsers,
            inactiveUsers,
            byRole: roleBreakdown.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        };

        return statistics;
    } catch (error) {
        throw error;
    }
};

/**
 * Get hotel staff by role (for assignment purposes)
 * @param {string} hotelId - Hotel ID
 * @param {string} role - Staff role (housekeeping, maintenance, etc.)
 * @returns {Array} Staff members
 */
const getHotelStaffByRole = async (hotelId, role) => {
    try {
        if (!hotelId) {
            throw new Error("Hotel ID is required");
        }

        const query = {
            hotelId,
            isActive: true,
        };

        if (role) {
            const validRoles = ["housekeeping", "maintenance", "receptionist"];
            if (!validRoles.includes(role)) {
                throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
            }
            query.role = role;
        }

        const staff = await User.find(query)
            .select("_id name email role")
            .sort({ name: 1 });

        return staff;
    } catch (error) {
        throw error;
    }
};

export default {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateUser,
    getUserStatistics,
    getHotelStaffByRole,
};

