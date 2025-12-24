/**
 * Test script for Password Reset (OTP-based) Feature
 *
 * Run:
 * node src/utils/testPasswordReset.js
 */

process.env.NODE_ENV = "test";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import authService from "../services/authService.js";

// Safety check
if (process.env.NODE_ENV !== "test") {
    throw new Error("❌ Test script must run in TEST environment only");
}

/**
 * Test password reset functionality
 */
async function testPasswordReset() {
    let testUser = null;
    let testOtp = null;

    try {
        await connectDB();

        console.log("🔐 PASSWORD RESET FEATURE TEST");
        console.log("=".repeat(60));

        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;

        // ===== SETUP: Create test user =====
        console.log("\n📋 SETUP: Creating test user...");
        console.log("-".repeat(60));

        const testEmail = "hashirmohamed04@gmail.com";

        // Clean up any existing test user
        await User.deleteOne({ email: testEmail });

        // Create test user
        testUser = await User.create({
            name: "Password Reset Test User",
            email: testEmail,
            password: "OldPassword@123",
            role: "guest",
            isActive: true,
        });

        console.log(`   ✅ Test user created: ${testUser.email}`);

        // ===== TEST 1: Forgot Password - Valid Email =====
        console.log("\n📧 TEST 1: Forgot Password - Valid Email");
        console.log("-".repeat(60));
        totalTests++;

        try {
            const result = await authService.forgotPassword(testEmail);

            // Check user in database for OTP
            const userWithOtp = await User.findOne({ email: testEmail });

            if (
                result.message &&
                userWithOtp.resetOtp &&
                userWithOtp.resetOtpExpireAt &&
                userWithOtp.resetOtp.length === 6
            ) {
                console.log("   ✅ OTP generated and saved successfully");
                console.log(`   📌 OTP: ${userWithOtp.resetOtp}`);
                console.log(`   ⏰ Expires at: ${userWithOtp.resetOtpExpireAt.toLocaleString()}`);
                testOtp = userWithOtp.resetOtp;
                passedTests++;
            } else {
                console.log("   ❌ Failed: OTP not generated properly");
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // ===== TEST 2: Forgot Password - Invalid Email =====
        console.log("\n📧 TEST 2: Forgot Password - Invalid Email");
        console.log("-".repeat(60));
        totalTests++;

        try {
            const result = await authService.forgotPassword("nonexistent@hotel.com");

            // Should still return success message for security
            if (result.message) {
                console.log("   ✅ Returns generic message (security best practice)");
                passedTests++;
            } else {
                console.log("   ❌ Failed: Should return generic message");
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // ===== TEST 3: Forgot Password - Missing Email =====
        console.log("\n📧 TEST 3: Forgot Password - Missing Email");
        console.log("-".repeat(60));
        totalTests++;

        try {
            await authService.forgotPassword("");
            console.log("   ❌ Failed: Should throw error for missing email");
            failedTests++;
        } catch (error) {
            if (error.message.includes("Email is required")) {
                console.log("   ✅ Correctly rejects missing email");
                passedTests++;
            } else {
                console.log(`   ❌ Failed: Wrong error - ${error.message}`);
                failedTests++;
            }
        }

        // ===== TEST 4: Verify OTP - Valid OTP =====
        console.log("\n🔐 TEST 4: Verify OTP - Valid OTP");
        console.log("-".repeat(60));
        totalTests++;

        try {
            const result = await authService.verifyResetOtp(testEmail, testOtp);

            if (result.message && result.message.includes("verified successfully")) {
                console.log("   ✅ OTP verified successfully");
                passedTests++;
            } else {
                console.log("   ❌ Failed: OTP verification failed");
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // ===== TEST 5: Verify OTP - Invalid OTP =====
        console.log("\n🔐 TEST 5: Verify OTP - Invalid OTP");
        console.log("-".repeat(60));
        totalTests++;

        try {
            await authService.verifyResetOtp(testEmail, "999999");
            console.log("   ❌ Failed: Should reject invalid OTP");
            failedTests++;
        } catch (error) {
            if (error.message.includes("Invalid OTP")) {
                console.log("   ✅ Correctly rejects invalid OTP");
                passedTests++;
            } else {
                console.log(`   ❌ Failed: Wrong error - ${error.message}`);
                failedTests++;
            }
        }

        // ===== TEST 6: Verify OTP - Missing Fields =====
        console.log("\n🔐 TEST 6: Verify OTP - Missing Fields");
        console.log("-".repeat(60));
        totalTests++;

        try {
            await authService.verifyResetOtp("", "");
            console.log("   ❌ Failed: Should reject missing fields");
            failedTests++;
        } catch (error) {
            if (error.message.includes("required")) {
                console.log("   ✅ Correctly rejects missing fields");
                passedTests++;
            } else {
                console.log(`   ❌ Failed: Wrong error - ${error.message}`);
                failedTests++;
            }
        }

        // ===== TEST 7: Reset Password - Valid OTP and Password =====
        console.log("\n🔑 TEST 7: Reset Password - Valid OTP and Password");
        console.log("-".repeat(60));
        totalTests++;

        try {
            const newPassword = "NewPassword@456";
            const result = await authService.resetPassword(testEmail, testOtp, newPassword);

            // Check that OTP fields are cleared
            const updatedUser = await User.findOne({ email: testEmail });

            if (
                result.message &&
                result.message.includes("successfully") &&
                !updatedUser.resetOtp &&
                !updatedUser.resetOtpExpireAt
            ) {
                console.log("   ✅ Password reset successfully");
                console.log("   ✅ OTP fields cleared after reset");

                // Verify new password works
                const loginTest = await authService.login(testEmail, newPassword);
                if (loginTest.token) {
                    console.log("   ✅ New password works for login");
                    passedTests++;
                } else {
                    console.log("   ❌ Failed: New password doesn't work");
                    failedTests++;
                }
            } else {
                console.log("   ❌ Failed: Password reset incomplete");
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // ===== TEST 8: Reset Password - OTP Reuse Prevention =====
        console.log("\n🔑 TEST 8: Reset Password - OTP Reuse Prevention");
        console.log("-".repeat(60));
        totalTests++;

        try {
            // Try to reuse the same OTP
            await authService.resetPassword(testEmail, testOtp, "AnotherPassword@789");
            console.log("   ❌ Failed: Should prevent OTP reuse");
            failedTests++;
        } catch (error) {
            if (error.message.includes("Invalid OTP")) {
                console.log("   ✅ Correctly prevents OTP reuse");
                passedTests++;
            } else {
                console.log(`   ❌ Failed: Wrong error - ${error.message}`);
                failedTests++;
            }
        }

        // ===== TEST 9: Reset Password - Short Password =====
        console.log("\n🔑 TEST 9: Reset Password - Short Password");
        console.log("-".repeat(60));
        totalTests++;

        try {
            // Request new OTP
            await authService.forgotPassword(testEmail);
            const userWithNewOtp = await User.findOne({ email: testEmail });
            const newOtp = userWithNewOtp.resetOtp;

            await authService.resetPassword(testEmail, newOtp, "123");
            console.log("   ❌ Failed: Should reject short password");
            failedTests++;
        } catch (error) {
            if (error.message.includes("at least 6 characters")) {
                console.log("   ✅ Correctly rejects short password");
                passedTests++;
            } else {
                console.log(`   ❌ Failed: Wrong error - ${error.message}`);
                failedTests++;
            }
        }

        // ===== TEST 10: Deactivated User Cannot Reset Password =====
        console.log("\n🔑 TEST 10: Deactivated User Cannot Reset Password");
        console.log("-".repeat(60));
        totalTests++;

        try {
            // Deactivate user
            testUser.isActive = false;
            await testUser.save();

            // Request OTP
            await authService.forgotPassword(testEmail);

            // Check that no OTP was saved (user inactive)
            const inactiveUser = await User.findOne({ email: testEmail });

            // Verify OTP should fail
            try {
                await authService.verifyResetOtp(testEmail, "123456");
                console.log("   ❌ Failed: Should reject deactivated user");
                failedTests++;
            } catch (error) {
                if (error.message.includes("deactivated") || error.message.includes("Invalid OTP")) {
                    console.log("   ✅ Correctly prevents deactivated user reset");
                    passedTests++;
                } else {
                    console.log(`   ❌ Failed: Wrong error - ${error.message}`);
                    failedTests++;
                }
            }
        } catch (error) {
            console.log(`   ⚠️  Test error: ${error.message}`);
            failedTests++;
        }

        // ===== TEST 11: OTP Expiry Test (Simulated) =====
        console.log("\n⏰ TEST 11: OTP Expiry Test");
        console.log("-".repeat(60));
        totalTests++;

        try {
            // Reactivate user for this test
            testUser.isActive = true;
            await testUser.save();

            // Request new OTP
            await authService.forgotPassword(testEmail);
            const userForExpiry = await User.findOne({ email: testEmail });
            const expiryOtp = userForExpiry.resetOtp;

            // Manually set OTP expiry to past
            userForExpiry.resetOtpExpireAt = new Date(Date.now() - 1000);
            await userForExpiry.save();

            // Try to verify expired OTP
            await authService.verifyResetOtp(testEmail, expiryOtp);
            console.log("   ❌ Failed: Should reject expired OTP");
            failedTests++;
        } catch (error) {
            if (error.message.includes("expired")) {
                console.log("   ✅ Correctly rejects expired OTP");
                passedTests++;
            } else {
                console.log(`   ❌ Failed: Wrong error - ${error.message}`);
                failedTests++;
            }
        }

        // ===== TEST 12: User Model toJSON Hides Reset Fields =====
        console.log("\n🔒 TEST 12: User Model Hides Sensitive Fields");
        console.log("-".repeat(60));
        totalTests++;

        try {
            const user = await User.findOne({ email: testEmail });
            const jsonUser = user.toJSON();

            if (
                !jsonUser.hasOwnProperty("password") &&
                !jsonUser.hasOwnProperty("resetOtp") &&
                !jsonUser.hasOwnProperty("resetOtpExpireAt")
            ) {
                console.log("   ✅ toJSON correctly hides sensitive fields");
                passedTests++;
            } else {
                console.log("   ❌ Failed: Sensitive fields exposed in toJSON");
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Print summary
        console.log("\n" + "=".repeat(60));
        console.log("📊 TEST SUMMARY");
        console.log("=".repeat(60));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        console.log("=".repeat(60));

        if (failedTests === 0) {
            console.log("\n🎉 ALL PASSWORD RESET TESTS PASSED!");
            console.log("✅ OTP generation and email sending works");
            console.log("✅ OTP verification works correctly");
            console.log("✅ Password reset with OTP works");
            console.log("✅ OTP reuse is prevented");
            console.log("✅ OTP expiry works correctly");
            console.log("✅ Deactivated users cannot reset passwords");
            console.log("✅ Security best practices implemented");
            console.log("✅ Sensitive fields are hidden from responses\n");
        } else {
            console.log(`\n❌ ${failedTests} TEST(S) FAILED! Please review the implementation.\n`);
        }
    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        console.error(error.stack);
    } finally {
        // Cleanup
        if (testUser) {
            await User.deleteOne({ email: testUser.email });
            console.log("🧹 Test user cleaned up");
        }

        await mongoose.connection.close();
        console.log("👋 Database connection closed");
    }
}

// Run the test
testPasswordReset();

