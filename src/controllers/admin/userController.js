import userService from "../../services/userService.js";

/**
 * Admin User Controller
 * Handles HTTP requests for admin user management
 */

/**
 * GET /api/admin/users
 * Get all users with optional filters and pagination
 */
export const getAllUsers = async (req, res) => {
    try {
        const { role, isActive, page, limit } = req.query;

        const filters = {};
        if (role) filters.role = role;
        if (isActive !== undefined) filters.isActive = isActive;

        const pagination = {};
        if (page) pagination.page = parseInt(page, 10);
        if (limit) pagination.limit = parseInt(limit, 10);

        const result = await userService.getAllUsers(filters, pagination);

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: result.users,
            pagination: result.pagination,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /api/admin/users/:id
 * Get single user by ID
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await userService.getUserById(id);

        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            data: user,
        });
    } catch (error) {
        const statusCode = error.message === "User not found" ? 404 : 400;
        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * PATCH /api/admin/users/:id/status
 * Update user status (activate/deactivate)
 */
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        // Validate isActive is provided
        if (isActive === undefined) {
            return res.status(400).json({
                success: false,
                message: "isActive field is required",
            });
        }

        // Validate isActive is boolean
        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be a boolean value",
            });
        }

        const user = await userService.updateUserStatus(id, isActive, req.user);

        res.status(200).json({
            success: true,
            message: `User ${isActive ? "activated" : "deactivated"} successfully`,
            data: user,
        });
    } catch (error) {
        let statusCode = 400;
        if (error.message === "User not found") {
            statusCode = 404;
        } else if (error.message === "You cannot deactivate your own account") {
            statusCode = 403;
        }

        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * PATCH /api/admin/users/:id
 * Update user details (name, role, isActive)
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate that at least one field is provided
        const allowedFields = ["name", "role", "isActive"];
        const hasValidField = allowedFields.some(
            (field) => updateData[field] !== undefined
        );

        if (!hasValidField) {
            return res.status(400).json({
                success: false,
                message: `At least one of the following fields is required: ${allowedFields.join(
                    ", "
                )}`,
            });
        }

        // Prevent password updates
        if (updateData.password !== undefined) {
            return res.status(400).json({
                success: false,
                message: "Password cannot be updated through this endpoint",
            });
        }

        const user = await userService.updateUser(id, updateData, req.user);

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user,
        });
    } catch (error) {
        let statusCode = 400;
        if (error.message === "User not found") {
            statusCode = 404;
        } else if (error.message === "You cannot deactivate your own account") {
            statusCode = 403;
        }

        res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /api/admin/users/statistics
 * Get user statistics
 */
export const getUserStatistics = async (req, res) => {
    try {
        const statistics = await userService.getUserStatistics();

        res.status(200).json({
            success: true,
            message: "User statistics retrieved successfully",
            data: statistics,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

