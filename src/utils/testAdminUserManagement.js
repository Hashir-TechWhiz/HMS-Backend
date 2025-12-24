/**
 * Test script for Admin User Management System
 *
 * Run:
 * node src/utils/testAdminUserManagement.js
 */

process.env.NODE_ENV = "test";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import userService from "../services/userService.js";

// Safety check
if (process.env.NODE_ENV !== "test") {
    throw new Error("❌ Test script must run in TEST environment only");
}

/**
 * Test admin user management features
 * Tests that:
 * 1. Admin can view all users
 * 2. Admin can filter users by role
 * 3. Admin can filter users by isActive status
 * 4. Admin can view user details
 * 5. Admin can update user status
 * 6. Admin can update user details (name, role)
 * 7. Admin CANNOT deactivate their own account
 * 8. Pagination works correctly
 */
async function testAdminUserManagement() {
    let testUsers = {};
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    try {
        await connectDB();

        console.log("🧹 Cleaning up old test data...");
        // Clean up test users from previous runs
        await User.deleteMany({
            email: {
                $in: [
                    "test.admin@hotel.com",
                    "test.guest1@hotel.com",
                    "test.guest2@hotel.com",
                    "test.receptionist1@hotel.com",
                    "test.housekeeping1@hotel.com",
                ],
            },
        });

        // Create test users
        console.log("\n👥 Creating test users...");

        const adminUser = await User.create({
            name: "Test Admin",
            email: "test.admin@hotel.com",
            password: "Admin@123",
            role: "admin",
            isActive: true,
        });
        testUsers.admin = adminUser;
        console.log(`   ✅ Admin: ${adminUser.email}`);

        const guest1 = await User.create({
            name: "Test Guest 1",
            email: "test.guest1@hotel.com",
            password: "Guest@123",
            role: "guest",
            isActive: true,
        });
        testUsers.guest1 = guest1;
        console.log(`   ✅ Guest 1: ${guest1.email}`);

        const guest2 = await User.create({
            name: "Test Guest 2",
            email: "test.guest2@hotel.com",
            password: "Guest@123",
            role: "guest",
            isActive: false,
        });
        testUsers.guest2 = guest2;
        console.log(`   ✅ Guest 2 (inactive): ${guest2.email}`);

        const receptionist1 = await User.create({
            name: "Test Receptionist",
            email: "test.receptionist1@hotel.com",
            password: "Receptionist@123",
            role: "receptionist",
            isActive: true,
        });
        testUsers.receptionist1 = receptionist1;
        console.log(`   ✅ Receptionist: ${receptionist1.email}`);

        const housekeeping1 = await User.create({
            name: "Test Housekeeping",
            email: "test.housekeeping1@hotel.com",
            password: "Housekeeping@123",
            role: "housekeeping",
            isActive: true,
        });
        testUsers.housekeeping1 = housekeeping1;
        console.log(`   ✅ Housekeeping: ${housekeeping1.email}\n`);

        // Mock current user (admin)
        const currentUser = {
            id: adminUser._id.toString(),
            email: adminUser.email,
            role: adminUser.role,
        };

        console.log("🧪 Running Admin User Management Tests...\n");
        console.log("=".repeat(60));

        // Test 1: Get all users
        console.log("\n📋 Test 1: Get All Users");
        console.log("-".repeat(60));
        totalTests++;
        try {
            const result = await userService.getAllUsers();
            if (result.users && result.users.length >= 5) {
                console.log(`   ✅ Retrieved ${result.users.length} users`);
                console.log(`   ✅ Pagination info present: ${!!result.pagination}`);
                passedTests++;
            } else {
                console.log(`   ❌ Expected at least 5 users, got ${result.users?.length || 0}`);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Test 2: Filter by role (guest)
        console.log("\n📋 Test 2: Filter Users by Role (guest)");
        console.log("-".repeat(60));
        totalTests++;
        try {
            const result = await userService.getAllUsers({ role: "guest" });
            const allGuests = result.users.every((user) => user.role === "guest");
            if (allGuests && result.users.length >= 2) {
                console.log(`   ✅ Retrieved ${result.users.length} guest users`);
                passedTests++;
            } else {
                console.log(`   ❌ Filter not working correctly`);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Test 3: Filter by isActive
        console.log("\n📋 Test 3: Filter Users by Active Status");
        console.log("-".repeat(60));
        totalTests++;
        try {
            const result = await userService.getAllUsers({ isActive: true });
            const allActive = result.users.every((user) => user.isActive === true);
            if (allActive) {
                console.log(`   ✅ Retrieved ${result.users.length} active users`);
                passedTests++;
            } else {
                console.log(`   ❌ Filter not working correctly`);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Test 4: Get user by ID
        console.log("\n📋 Test 4: Get User by ID");
        console.log("-".repeat(60));
        totalTests++;
        try {
            const user = await userService.getUserById(guest1._id.toString());
            if (
                user &&
                user.email === guest1.email &&
                !user.password &&
                !user.resetOtp
            ) {
                console.log(`   ✅ Retrieved user: ${user.email}`);
                console.log(`   ✅ Password not exposed`);
                passedTests++;
            } else {
                console.log(`   ❌ User retrieval failed or sensitive data exposed`);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Test 5: Update user status (deactivate)
        console.log("\n📋 Test 5: Update User Status (Deactivate Guest)");
        console.log("-".repeat(60));
        totalTests++;
        try {
            const updatedUser = await userService.updateUserStatus(
                guest1._id.toString(),
                false,
                currentUser
            );
            if (updatedUser && updatedUser.isActive === false) {
                console.log(`   ✅ User deactivated: ${updatedUser.email}`);
                passedTests++;
            } else {
                console.log(`   ❌ Status update failed`);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Test 6: Update user status (reactivate)
        console.log("\n📋 Test 6: Update User Status (Reactivate Guest)");
        console.log("-".repeat(60));
        totalTests++;
        try {
            const updatedUser = await userService.updateUserStatus(
                guest1._id.toString(),
                true,
                currentUser
            );
            if (updatedUser && updatedUser.isActive === true) {
                console.log(`   ✅ User reactivated: ${updatedUser.email}`);
                passedTests++;
            } else {
                console.log(`   ❌ Status update failed`);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Test 7: Admin cannot deactivate own account
        console.log("\n📋 Test 7: Admin Cannot Deactivate Own Account");
        console.log("-".repeat(60));
        totalTests++;
        try {
            await userService.updateUserStatus(
                adminUser._id.toString(),
                false,
                currentUser
            );
            console.log(`   ❌ Admin was able to deactivate own account (should be prevented)`);
            failedTests++;
        } catch (error) {
            if (error.message === "You cannot deactivate your own account") {
                console.log(`   ✅ Correctly prevented: ${error.message}`);
                passedTests++;
            } else {
                console.log(`   ❌ Unexpected error: ${error.message}`);
                failedTests++;
            }
        }

        // Test 8: Update user details (name)
        console.log("\n📋 Test 8: Update User Name");
        console.log("-".repeat(60));
        totalTests++;
        try {
            const updatedUser = await userService.updateUser(
                guest1._id.toString(),
                { name: "Updated Guest Name" },
                currentUser
            );
            if (updatedUser && updatedUser.name === "Updated Guest Name") {
                console.log(`   ✅ User name updated: ${updatedUser.name}`);
                passedTests++;
            } else {
                console.log(`   ❌ Name update failed`);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Test 9: Update user role
        console.log("\n📋 Test 9: Update User Role");
        console.log("-".repeat(60));
        totalTests++;
        try {
            const updatedUser = await userService.updateUser(
                guest1._id.toString(),
                { role: "receptionist" },
                currentUser
            );
            if (updatedUser && updatedUser.role === "receptionist") {
                console.log(`   ✅ User role updated: ${updatedUser.role}`);
                passedTests++;
            } else {
                console.log(`   ❌ Role update failed`);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Test 10: Invalid role rejection
        console.log("\n📋 Test 10: Reject Invalid Role");
        console.log("-".repeat(60));
        totalTests++;
        try {
            await userService.updateUser(
                guest1._id.toString(),
                { role: "superadmin" },
                currentUser
            );
            console.log(`   ❌ Invalid role was accepted (should be rejected)`);
            failedTests++;
        } catch (error) {
            if (error.message.includes("Invalid role")) {
                console.log(`   ✅ Invalid role rejected: ${error.message}`);
                passedTests++;
            } else {
                console.log(`   ❌ Unexpected error: ${error.message}`);
                failedTests++;
            }
        }

        // Test 11: Pagination
        console.log("\n📋 Test 11: Pagination");
        console.log("-".repeat(60));
        totalTests++;
        try {
            const page1 = await userService.getAllUsers({}, { page: 1, limit: 2 });
            const page2 = await userService.getAllUsers({}, { page: 2, limit: 2 });

            if (
                page1.users.length === 2 &&
                page2.users.length >= 1 &&
                page1.users[0]._id.toString() !== page2.users[0]._id.toString()
            ) {
                console.log(`   ✅ Page 1: ${page1.users.length} users`);
                console.log(`   ✅ Page 2: ${page2.users.length} users`);
                console.log(`   ✅ Different users on different pages`);
                passedTests++;
            } else {
                console.log(`   ❌ Pagination not working correctly`);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Test 12: Get user statistics
        console.log("\n📋 Test 12: Get User Statistics");
        console.log("-".repeat(60));
        totalTests++;
        try {
            const stats = await userService.getUserStatistics();
            if (
                stats.total >= 5 &&
                stats.activeUsers >= 1 &&
                stats.byRole &&
                typeof stats.byRole === "object"
            ) {
                console.log(`   ✅ Total users: ${stats.total}`);
                console.log(`   ✅ Active users: ${stats.activeUsers}`);
                console.log(`   ✅ Inactive users: ${stats.inactiveUsers}`);
                console.log(`   ✅ By role:`, stats.byRole);
                passedTests++;
            } else {
                console.log(`   ❌ Statistics format incorrect`);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Test 13: Combined filters (role + isActive)
        console.log("\n📋 Test 13: Combined Filters (Role + Active Status)");
        console.log("-".repeat(60));
        totalTests++;
        try {
            const result = await userService.getAllUsers({
                role: "guest",
                isActive: true,
            });
            const allMatch = result.users.every(
                (user) => user.role === "guest" && user.isActive === true
            );
            if (allMatch) {
                console.log(
                    `   ✅ Retrieved ${result.users.length} active guest users`
                );
                passedTests++;
            } else {
                console.log(`   ❌ Combined filters not working correctly`);
                failedTests++;
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            failedTests++;
        }

        // Print summary
        console.log("\n" + "=".repeat(60));
        console.log(`📊 TEST SUMMARY`);
        console.log("=".repeat(60));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        console.log("=".repeat(60));

        if (failedTests === 0) {
            console.log("\n🎉 ALL ADMIN USER MANAGEMENT TESTS PASSED!");
            console.log("✅ Admin can view all users");
            console.log("✅ Admin can filter users by role and status");
            console.log("✅ Admin can view user details");
            console.log("✅ Admin can activate/deactivate users");
            console.log("✅ Admin can update user details");
            console.log("✅ Admin CANNOT deactivate own account");
            console.log("✅ Pagination works correctly");
            console.log("✅ Invalid data is rejected");
            console.log("✅ Sensitive data is not exposed\n");
        } else {
            console.log(
                `\n❌ ${failedTests} TEST(S) FAILED! Please review the implementation.\n`
            );
        }

        // Cleanup test data
        console.log("🧹 Cleaning up test data...");
        await User.deleteMany({
            email: {
                $in: [
                    "test.admin@hotel.com",
                    "test.guest1@hotel.com",
                    "test.guest2@hotel.com",
                    "test.receptionist1@hotel.com",
                    "test.housekeeping1@hotel.com",
                ],
            },
        });
        console.log("   ✅ Test users deleted");
    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("👋 Database connection closed");
    }
}

// Run the test
testAdminUserManagement();

