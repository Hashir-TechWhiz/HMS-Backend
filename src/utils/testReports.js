/**
 * Test script for Reporting functionality
 *
 * Run:
 * node src/utils/testReports.js
 */

process.env.NODE_ENV = "test";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import ServiceRequest from "../models/ServiceRequest.js";
import reportService from "../services/reportService.js";

// Safety check
if (process.env.NODE_ENV !== "test") {
    throw new Error("❌ Test script must run in TEST environment only");
}

/**
 * Test script to verify reporting functionality
 * - Tests report data accuracy
 * - Verifies aggregation logic
 */
async function testReports() {
    try {
        await connectDB();

        // Get actual counts from database
        console.log("📊 Fetching actual database counts...\n");

        // Booking counts
        const totalBookings = await Booking.countDocuments();
        const pendingBookings = await Booking.countDocuments({ status: "pending" });
        const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });
        const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });

        console.log("📅 Booking Counts:");
        console.log(`   Total: ${totalBookings}`);
        console.log(`   Pending: ${pendingBookings}`);
        console.log(`   Confirmed: ${confirmedBookings}`);
        console.log(`   Cancelled: ${cancelledBookings}\n`);

        // Room counts
        const totalRooms = await Room.countDocuments();
        const availableRooms = await Room.countDocuments({ status: "available" });
        const unavailableRooms = await Room.countDocuments({ status: "unavailable" });
        const maintenanceRooms = await Room.countDocuments({ status: "maintenance" });

        console.log("🏨 Room Counts:");
        console.log(`   Total: ${totalRooms}`);
        console.log(`   Available: ${availableRooms}`);
        console.log(`   Unavailable: ${unavailableRooms}`);
        console.log(`   Maintenance: ${maintenanceRooms}\n`);

        // Service request counts
        const totalServiceRequests = await ServiceRequest.countDocuments();
        const pendingServiceRequests = await ServiceRequest.countDocuments({ status: "pending" });
        const inProgressServiceRequests = await ServiceRequest.countDocuments({
            status: "in_progress",
        });
        const completedServiceRequests = await ServiceRequest.countDocuments({
            status: "completed",
        });
        const housekeepingServiceRequests = await ServiceRequest.countDocuments({
            assignedRole: "housekeeping",
        });
        const maintenanceServiceRequests = await ServiceRequest.countDocuments({
            assignedRole: "maintenance",
        });

        console.log("🔧 Service Request Counts:");
        console.log(`   Total: ${totalServiceRequests}`);
        console.log(`   Pending: ${pendingServiceRequests}`);
        console.log(`   In Progress: ${inProgressServiceRequests}`);
        console.log(`   Completed: ${completedServiceRequests}`);
        console.log(`   Housekeeping: ${housekeepingServiceRequests}`);
        console.log(`   Maintenance: ${maintenanceServiceRequests}\n`);

        // Test report service
        console.log("🧪 Testing Report Service...\n");

        // Test booking summary
        console.log("📋 Testing Booking Summary Report...");
        const bookingSummary = await reportService.getBookingSummary();
        console.log("   Report Result:", JSON.stringify(bookingSummary, null, 2));

        // Verify booking summary
        let bookingErrors = 0;
        if (bookingSummary.totalBookings !== totalBookings) {
            console.log(`   ❌ ERROR: Total bookings mismatch! Expected ${totalBookings}, got ${bookingSummary.totalBookings}`);
            bookingErrors++;
        } else {
            console.log(`   ✅ Total bookings correct: ${totalBookings}`);
        }

        if (bookingSummary.byStatus.pending !== pendingBookings) {
            console.log(`   ❌ ERROR: Pending bookings mismatch! Expected ${pendingBookings}, got ${bookingSummary.byStatus.pending}`);
            bookingErrors++;
        } else {
            console.log(`   ✅ Pending bookings correct: ${pendingBookings}`);
        }

        if (bookingSummary.byStatus.confirmed !== confirmedBookings) {
            console.log(`   ❌ ERROR: Confirmed bookings mismatch! Expected ${confirmedBookings}, got ${bookingSummary.byStatus.confirmed}`);
            bookingErrors++;
        } else {
            console.log(`   ✅ Confirmed bookings correct: ${confirmedBookings}`);
        }

        if (bookingSummary.byStatus.cancelled !== cancelledBookings) {
            console.log(`   ❌ ERROR: Cancelled bookings mismatch! Expected ${cancelledBookings}, got ${bookingSummary.byStatus.cancelled}`);
            bookingErrors++;
        } else {
            console.log(`   ✅ Cancelled bookings correct: ${cancelledBookings}`);
        }

        if (bookingErrors === 0) {
            console.log("   ✅ Booking Summary Report is ACCURATE!\n");
        } else {
            console.log(`   ❌ Booking Summary Report has ${bookingErrors} error(s)!\n`);
        }

        // Test room overview
        console.log("📋 Testing Room Overview Report...");
        const roomOverview = await reportService.getRoomOverview();
        console.log("   Report Result:", JSON.stringify(roomOverview, null, 2));

        // Verify room overview
        let roomErrors = 0;
        if (roomOverview.totalRooms !== totalRooms) {
            console.log(`   ❌ ERROR: Total rooms mismatch! Expected ${totalRooms}, got ${roomOverview.totalRooms}`);
            roomErrors++;
        } else {
            console.log(`   ✅ Total rooms correct: ${totalRooms}`);
        }

        if (roomOverview.byStatus.available !== availableRooms) {
            console.log(`   ❌ ERROR: Available rooms mismatch! Expected ${availableRooms}, got ${roomOverview.byStatus.available}`);
            roomErrors++;
        } else {
            console.log(`   ✅ Available rooms correct: ${availableRooms}`);
        }

        if (roomOverview.byStatus.unavailable !== unavailableRooms) {
            console.log(`   ❌ ERROR: Unavailable rooms mismatch! Expected ${unavailableRooms}, got ${roomOverview.byStatus.unavailable}`);
            roomErrors++;
        } else {
            console.log(`   ✅ Unavailable rooms correct: ${unavailableRooms}`);
        }

        if (roomOverview.byStatus.maintenance !== maintenanceRooms) {
            console.log(`   ❌ ERROR: Maintenance rooms mismatch! Expected ${maintenanceRooms}, got ${roomOverview.byStatus.maintenance}`);
            roomErrors++;
        } else {
            console.log(`   ✅ Maintenance rooms correct: ${maintenanceRooms}`);
        }

        if (roomErrors === 0) {
            console.log("   ✅ Room Overview Report is ACCURATE!\n");
        } else {
            console.log(`   ❌ Room Overview Report has ${roomErrors} error(s)!\n`);
        }

        // Test service request overview
        console.log("📋 Testing Service Request Overview Report...");
        const serviceRequestOverview = await reportService.getServiceRequestOverview();
        console.log("   Report Result:", JSON.stringify(serviceRequestOverview, null, 2));

        // Verify service request overview
        let serviceRequestErrors = 0;
        if (serviceRequestOverview.totalServiceRequests !== totalServiceRequests) {
            console.log(`   ❌ ERROR: Total service requests mismatch! Expected ${totalServiceRequests}, got ${serviceRequestOverview.totalServiceRequests}`);
            serviceRequestErrors++;
        } else {
            console.log(`   ✅ Total service requests correct: ${totalServiceRequests}`);
        }

        if (serviceRequestOverview.byStatus.pending !== pendingServiceRequests) {
            console.log(`   ❌ ERROR: Pending service requests mismatch! Expected ${pendingServiceRequests}, got ${serviceRequestOverview.byStatus.pending}`);
            serviceRequestErrors++;
        } else {
            console.log(`   ✅ Pending service requests correct: ${pendingServiceRequests}`);
        }

        if (serviceRequestOverview.byStatus.in_progress !== inProgressServiceRequests) {
            console.log(`   ❌ ERROR: In progress service requests mismatch! Expected ${inProgressServiceRequests}, got ${serviceRequestOverview.byStatus.in_progress}`);
            serviceRequestErrors++;
        } else {
            console.log(`   ✅ In progress service requests correct: ${inProgressServiceRequests}`);
        }

        if (serviceRequestOverview.byStatus.completed !== completedServiceRequests) {
            console.log(`   ❌ ERROR: Completed service requests mismatch! Expected ${completedServiceRequests}, got ${serviceRequestOverview.byStatus.completed}`);
            serviceRequestErrors++;
        } else {
            console.log(`   ✅ Completed service requests correct: ${completedServiceRequests}`);
        }

        if (serviceRequestOverview.byAssignedRole.housekeeping !== housekeepingServiceRequests) {
            console.log(`   ❌ ERROR: Housekeeping service requests mismatch! Expected ${housekeepingServiceRequests}, got ${serviceRequestOverview.byAssignedRole.housekeeping}`);
            serviceRequestErrors++;
        } else {
            console.log(
                `   ✅ Housekeeping service requests correct: ${housekeepingServiceRequests}`
            );
        }

        if (serviceRequestOverview.byAssignedRole.maintenance !== maintenanceServiceRequests) {
            console.log(`   ❌ ERROR: Maintenance service requests mismatch! Expected ${maintenanceServiceRequests}, got ${serviceRequestOverview.byAssignedRole.maintenance}`);
            serviceRequestErrors++;
        } else {
            console.log(
                `   ✅ Maintenance service requests correct: ${maintenanceServiceRequests}`
            );
        }

        if (serviceRequestErrors === 0) {
            console.log("   ✅ Service Request Overview Report is ACCURATE!\n");
        } else {
            console.log(`   ❌ Service Request Overview Report has ${serviceRequestErrors} error(s)!\n`);
        }

        // Test combined overview
        console.log("📋 Testing Combined Overview Report...");
        const allReports = await reportService.getAllReports();
        console.log("   Report Result:", JSON.stringify(allReports, null, 3));

        // Verify combined report structure
        let combinedErrors = 0;
        if (!allReports.bookings || !allReports.rooms || !allReports.serviceRequests) {
            console.log("   ❌ ERROR: Combined report is missing required sections!");
            combinedErrors++;
        } else {
            console.log("   ✅ Combined report has all required sections");

            // Quick verification of combined totals
            if (allReports.bookings.totalBookings === totalBookings) {
                console.log("   ✅ Combined bookings total correct");
            } else {
                console.log("   ❌ Combined bookings total incorrect");
                combinedErrors++;
            }

            if (allReports.rooms.totalRooms === totalRooms) {
                console.log("   ✅ Combined rooms total correct");
            } else {
                console.log("   ❌ Combined rooms total incorrect");
                combinedErrors++;
            }

            if (allReports.serviceRequests.totalServiceRequests === totalServiceRequests) {
                console.log("   ✅ Combined service requests total correct");
            } else {
                console.log("   ❌ Combined service requests total incorrect");
                combinedErrors++;
            }
        }

        if (combinedErrors === 0) {
            console.log("   ✅ Combined Overview Report is ACCURATE!\n");
        } else {
            console.log(`   ❌ Combined Overview Report has ${combinedErrors} error(s)!\n`);
        }

        // Summary
        const totalErrors = bookingErrors + roomErrors + serviceRequestErrors + combinedErrors;
        console.log("\n" + "=".repeat(60));
        if (totalErrors === 0) {
            console.log("✅ ALL TESTS PASSED! Reporting functionality is working correctly!");
        } else {
            console.log(`❌ TESTS FAILED! Total errors: ${totalErrors}`);
        }
        console.log("=".repeat(60) + "\n");

        console.log("💡 Next Steps:");
        console.log("   1. Start the server: npm start");
        console.log("   2. Test endpoints with different user roles:");
        console.log("      - GET /api/reports/overview (Admin/Receptionist)");
        console.log("      - GET /api/reports/bookings (Admin/Receptionist)");
        console.log("      - GET /api/reports/rooms (Admin/Receptionist)");
        console.log("      - GET /api/reports/service-requests (Admin/Receptionist)");
        console.log("   3. Verify that guests and housekeeping CANNOT access these endpoints\n");
    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("👋 Database connection closed");
    }
}

// Run the test
testReports();

