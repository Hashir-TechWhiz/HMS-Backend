import authService from "../../services/authService.js";
import { getAuthCookieOptions } from "../../utils/cookieUtils.js";

class AuthController {
    /**
     * Register a new guest user
     * POST /api/auth/register
     * Creates a guest account
     */
    async register(req, res, next) {
        try {
            // Extract only name, email, password (ignore any role in request)
            const { name, email, password } = req.body;

            const user = await authService.registerGuest({
                name,
                email,
                password,
            });

            res.status(201).json({
                success: true,
                message: "Registration successful. Please login to continue.",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     * POST /api/auth/login
     * Sets JWT token in HttpOnly cookie
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const result = await authService.login(email, password);

            // Set JWT token in HttpOnly cookie
            res.cookie("token", result.token, getAuthCookieOptions());

            // Return user data without token (token is in cookie)
            res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    user: result.user,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create new user (Admin only)
     * POST /api/auth/users
     */
    async createUser(req, res, next) {
        try {
            // req.user is set by authenticate middleware
            const requesterId = req.user.id;

            const user = await authService.createUser(req.body, requesterId);

            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user profile
     * GET /api/auth/me
     */
    async getCurrentUser(req, res, next) {
        try {
            // req.user is set by authenticate middleware
            const userId = req.user.id;

            const user = await authService.getUserById(userId);

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update current user profile
     * PATCH /api/auth/me
     */
    async updateCurrentUser(req, res, next) {
        try {
            // req.user is set by authenticate middleware
            const userId = req.user.id;

            const user = await authService.updateUser(userId, req.body);

            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout user
     * POST /api/auth/logout
     * Clears the authentication cookie
     */
    async logout(req, res) {
        // Clear the authentication cookie
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            path: "/",
        });

        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    }

    /**
     * Forgot Password - Request OTP
     * POST /api/auth/forgot-password
     * Sends OTP to user's email
     */
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;

            const result = await authService.forgotPassword(email);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify Reset OTP
     * POST /api/auth/verify-reset-otp
     * Verifies the OTP before password reset
     */
    async verifyResetOtp(req, res, next) {
        try {
            const { email, otp } = req.body;

            const result = await authService.verifyResetOtp(email, otp);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reset Password
     * POST /api/auth/reset-password
     * Resets password using OTP
     */
    async resetPassword(req, res, next) {
        try {
            const { email, otp, newPassword } = req.body;

            const result = await authService.resetPassword(email, otp, newPassword);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();

