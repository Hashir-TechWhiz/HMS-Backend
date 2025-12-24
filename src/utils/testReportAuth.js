/**
 * Test script for Report Authorization & Role-Based Access Control
 *
 * Run:
 * node src/utils/testReportAuth.js
 */

process.env.NODE_ENV = "test";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import reportService from "../services/reportService.js";

// Safety check
if (process.env.NODE_ENV !== "test") {
    throw new Error("❌ Test script must run in TEST environment only");
}

/**
 * Test authorization by simulating middleware behavior
 * Tests that:
 * 1. Guests CANNOT access reporting endpoints (authorize middleware blocks them)
 * 2. Housekeeping CANNOT access reporting endpoints (authorize middleware blocks them)
 * 3. Admin CAN access all reporting endpoints
 * 4. Receptionist CAN access all reporting endpoints
 * 5. Report services work correctly for authorized users
 */
async function testReportAuthorization() {
    let testUsers = {};

    try {
        await connectDB();

        // Find or create test users for each role
        console.log("👥 Setting up test users...");

        // Find admin user
        let adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) {
            console.log("   Creating admin user...");
            adminUser = await User.create({
                name: "Test Admin",
                email: "admin.test@hotel.com",
                password: "Admin@123",
                role: "admin",
            });
        }
        testUsers.admin = adminUser;
        console.log(`   ✅ Admin user: ${adminUser.email}`);

        // Find or create receptionist user
        let receptionistUser = await User.findOne({ role: "receptionist" });
        if (!receptionistUser) {
            console.log("   Creating receptionist user...");
            receptionistUser = await User.create({
                name: "Test Receptionist",
                email: "receptionist.test@hotel.com",
                password: "Receptionist@123",
                role: "receptionist",
            });
        }
        testUsers.receptionist = receptionistUser;
        console.log(`   ✅ Receptionist user: ${receptionistUser.email}`);

        // Find or create guest user
        let guestUser = await User.findOne({ role: "guest" });
        if (!guestUser) {
            console.log("   Creating guest user...");
            guestUser = await User.create({
                name: "Test Guest",
                email: "guest.test@hotel.com",
                password: "Guest@123",
                role: "guest",
            });
        }
        testUsers.guest = guestUser;
        console.log(`   ✅ Guest user: ${guestUser.email}`);

        // Find or create housekeeping user
        let housekeepingUser = await User.findOne({ role: "housekeeping" });
        if (!housekeepingUser) {
            console.log("   Creating housekeeping user...");
            housekeepingUser = await User.create({
                name: "Test Housekeeping",
                email: "housekeeping.test@hotel.com",
                password: "Housekeeping@123",
                role: "housekeeping",
            });
        }
        testUsers.housekeeping = housekeepingUser;
        console.log(`   ✅ Housekeeping user: ${housekeepingUser.email}\n`);

        console.log("🧪 Testing Authorization Logic...\n");

        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;

        // Test authorization middleware directly
        console.log("📋 Testing Authorization Middleware...");
        console.log("-".repeat(60));

        const allowedRoles = ["admin", "receptionist"];
        const authorizeMiddleware = authorize(...allowedRoles);

        for (const [roleName, user] of Object.entries(testUsers)) {
            totalTests++;

            // Create mock request with user attached (simulating authenticate middleware)
            const mockReq = {
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role,
                },
            };

            let statusCode = null;
            let responseMessage = null;

            // Create mock response
            const mockRes = {
                status: function (code) {
                    statusCode = code;
                    return this;
                },
                json: function (data) {
                    responseMessage = data.message;
                    return this;
                },
            };

            // Create mock next function
            let nextCalled = false;
            const mockNext = () => {
                nextCalled = true;
            };

            // Call authorize middleware
            authorizeMiddleware(mockReq, mockRes, mockNext);

            // Determine expected behavior
            const shouldHaveAccess = roleName === "admin" || roleName === "receptionist";

            if (shouldHaveAccess) {
                // Admin and receptionist should pass through (next called)
                if (nextCalled && !statusCode) {
                    console.log(`   ✅ ${roleName.toUpperCase()}: Access granted - CORRECT`);
                    passedTests++;
                } else {
                    console.log(
                        `   ❌ ${roleName.toUpperCase()}: Access denied (${statusCode}) - INCORRECT! Should have access`
                    );
                    failedTests++;
                }
            } else {
                // Guest and housekeeping should get 403
                if (statusCode === 403 && !nextCalled) {
                    console.log(`   ✅ ${roleName.toUpperCase()}: Access denied (403) - CORRECT`);
                    passedTests++;
                } else if (nextCalled) {
                    console.log(
                        `   ❌ ${roleName.toUpperCase()}: Access granted - INCORRECT! Should be denied`
                    );
                    failedTests++;
                } else {
                    console.log(`   ⚠️  ${roleName.toUpperCase()}: Unexpected behavior`);
                    failedTests++;
                }
            }
        }

        // Test without user (unauthenticated)
        totalTests++;
        const mockReqNoUser = {};
        let statusCode = null;
        const mockResNoUser = {
            status: function (code) {
                statusCode = code;
                return this;
            },
            json: function () {
                return this;
            },
        };
        let nextCalled = false;
        const mockNextNoUser = () => {
            nextCalled = true;
        };

        authorizeMiddleware(mockReqNoUser, mockResNoUser, mockNextNoUser);

        if (statusCode === 401 && !nextCalled) {
            console.log(`   ✅ UNAUTHENTICATED: Access denied (401) - CORRECT`);
            passedTests++;
        } else {
            console.log(`   ❌ UNAUTHENTICATED: Unexpected behavior - Should be 401`);
            failedTests++;
        }

        // Test report services for authorized users
        console.log("\n📊 Testing Report Services...");
        console.log("-".repeat(60));

        const reportTests = [
            { name: "Booking Summary", method: "getBookingSummary" },
            { name: "Room Overview", method: "getRoomOverview" },
            { name: "Service Request Overview", method: "getServiceRequestOverview" },
            { name: "All Reports", method: "getAllReports" },
        ];

        for (const test of reportTests) {
            totalTests++;
            try {
                const result = await reportService[test.method]();
                if (result && typeof result === "object") {
                    console.log(`   ✅ ${test.name}: Service working correctly`);
                    passedTests++;
                } else {
                    console.log(`   ❌ ${test.name}: Service returned invalid data`);
                    failedTests++;
                }
            } catch (error) {
                console.log(`   ❌ ${test.name}: Service failed - ${error.message}`);
                failedTests++;
            }
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
            console.log("\n🎉 ALL AUTHORIZATION TESTS PASSED!");
            console.log("✅ Guests CANNOT access reporting endpoints");
            console.log("✅ Housekeeping CANNOT access reporting endpoints");
            console.log("✅ Admin CAN access all reporting endpoints");
            console.log("✅ Receptionist CAN access all reporting endpoints");
            console.log("✅ Unauthenticated users CANNOT access reporting endpoints\n");
        } else {
            console.log(`\n❌ ${failedTests} TEST(S) FAILED! Please review the authorization logic.\n`);
        }
    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("👋 Database connection closed");
    }
}

// Run the test
testReportAuthorization();