import express from "express";
import authController from "../controllers/auth/authController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new guest user
 * @access  Public
 */
router.post("/register", authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post("/login", authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clears authentication cookie)
 * @access  Public
 */
router.post("/logout", authController.logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset OTP via email
 * @access  Public
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @route   POST /api/auth/verify-reset-otp
 * @desc    Verify the password reset OTP
 * @access  Public
 */
router.post("/verify-reset-otp", authController.verifyResetOtp);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using OTP
 * @access  Public
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @route   POST /api/auth/users
 * @desc    Create new user (Admin only)
 * @access  Private/Admin
 */
router.post(
    "/users",
    authenticate,
    authorize("admin"),
    authController.createUser
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, authController.getCurrentUser);

/**
 * @route   PATCH /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch("/me", authenticate, authController.updateCurrentUser);

export default router;

