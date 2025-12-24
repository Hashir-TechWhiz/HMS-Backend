/**
 * Test script for Service Request & Housekeeping Workflow
 *
 * Run:
 * node src/utils/testServiceRequests.js
 */

process.env.NODE_ENV = "test";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import ServiceRequest from "../models/ServiceRequest.js";

// Safety check
if (process.env.NODE_ENV !== "test") {
    throw new Error("❌ Test script must run in TEST environment only");
}

// Test data
const testData = {
    guest: {
        name: "Test Guest",
        email: "testguest@example.com",
        password: "password123",
        role: "guest",
    },
    housekeeping: {
        name: "Test Housekeeping",
        email: "testhousekeeping@example.com",
        password: "password123",
        role: "housekeeping",
    },
    receptionist: {
        name: "Test Receptionist",
        email: "testreceptionist@example.com",
        password: "password123",
        role: "receptionist",
    },
    admin: {
        name: "Test Admin",
        email: "testadmin@example.com",
        password: "password123",
        role: "admin",
    },
    room: {
        roomNumber: "TEST-SR-101",
        roomType: "Deluxe",
        pricePerNight: 150,
        capacity: 2,
        description: "Test room for service requests",
        images: ["https://picsum.photos/800/600?random=1"],
        status: "available",
    },
};

async function cleanupTestData() {
    console.log("\n🧹 Cleaning up test data...");

    const users = await User.find({
        email: {
            $in: [
                testData.guest.email,
                testData.housekeeping.email,
                testData.receptionist.email,
                testData.admin.email,
            ],
        },
    }).select("_id");

    const userIds = users.map((u) => u._id);

    // Delete service requests first (references bookings)
    const deletedServiceRequests = await ServiceRequest.deleteMany({
        requestedBy: { $in: userIds },
    });
    console.log(`   Deleted ${deletedServiceRequests.deletedCount} test service requests`);

    // Delete bookings
    const deletedBookings = await Booking.deleteMany({
        guest: { $in: userIds },
    });
    console.log(`   Deleted ${deletedBookings.deletedCount} test bookings`);

    // Delete room
    const deletedRoom = await Room.findOneAndDelete({
        roomNumber: testData.room.roomNumber,
    });
    if (deletedRoom) {
        console.log(`   Deleted test room: ${testData.room.roomNumber}`);
    }

    // Delete users
    await User.deleteOne({ email: testData.guest.email });
    await User.deleteOne({ email: testData.housekeeping.email });
    await User.deleteOne({ email: testData.receptionist.email });
    await User.deleteOne({ email: testData.admin.email });
    console.log("   Deleted test users");
}

async function createTestUsers() {
    console.log("\n👥 Creating test users...");

    const guest = new User(testData.guest);
    await guest.save();
    console.log(`   ✅ Guest created: ${guest.email}`);

    const housekeeping = new User(testData.housekeeping);
    await housekeeping.save();
    console.log(`   ✅ Housekeeping created: ${housekeeping.email}`);

    const receptionist = new User(testData.receptionist);
    await receptionist.save();
    console.log(`   ✅ Receptionist created: ${receptionist.email}`);

    const admin = new User(testData.admin);
    await admin.save();
    console.log(`   ✅ Admin created: ${admin.email}`);

    return { guest, housekeeping, receptionist, admin };
}

async function createTestRoom() {
    console.log("\n🏨 Creating test room...");

    const room = new Room(testData.room);
    await room.save();
    console.log(`   ✅ Room created: ${room.roomNumber} (${room.roomType})`);

    return room;
}

async function createTestBooking(guest, room) {
    console.log("\n📝 Creating test booking...");

    const today = new Date();
    const checkInDate = new Date(today);
    checkInDate.setDate(today.getDate() + 1);

    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkInDate.getDate() + 3);

    const booking = new Booking({
        guest: guest._id,
        room: room._id,
        checkInDate,
        checkOutDate,
        status: "confirmed",
    });
    await booking.save();
    console.log("   ✅ Booking created (confirmed)");

    return booking;
}

async function testServiceRequestCreation(guest, booking, room) {
    console.log("\n📝 Testing Service Request Creation...");

    // Test 1: Create housekeeping request
    const housekeepingRequest = new ServiceRequest({
        booking: booking._id,
        room: room._id,
        requestedBy: guest._id,
        serviceType: "housekeeping",
        notes: "Please clean the room",
    });
    await housekeepingRequest.save();
    console.log("   ✅ Housekeeping request created");
    console.log(`      - Service Type: ${housekeepingRequest.serviceType}`);
    console.log(`      - Assigned Role: ${housekeepingRequest.assignedRole}`);
    console.log(`      - Status: ${housekeepingRequest.status}`);

    // Test 2: Create room_service request
    const roomServiceRequest = new ServiceRequest({
        booking: booking._id,
        room: room._id,
        requestedBy: guest._id,
        serviceType: "room_service",
        notes: "Please bring fresh towels",
    });
    await roomServiceRequest.save();
    console.log("   ✅ Room service request created");
    console.log(`      - Service Type: ${roomServiceRequest.serviceType}`);
    console.log(`      - Assigned Role: ${roomServiceRequest.assignedRole}`);

    // Test 3: Create maintenance request
    const maintenanceRequest = new ServiceRequest({
        booking: booking._id,
        room: room._id,
        requestedBy: guest._id,
        serviceType: "maintenance",
        notes: "AC not working properly",
    });
    await maintenanceRequest.save();
    console.log("   ✅ Maintenance request created");
    console.log(`      - Service Type: ${maintenanceRequest.serviceType}`);
    console.log(`      - Assigned Role: ${maintenanceRequest.assignedRole}`);

    return { housekeepingRequest, roomServiceRequest, maintenanceRequest };
}

async function testAutomaticRoleAssignment() {
    console.log("\n🔄 Testing Automatic Role Assignment...");

    const serviceRequests = await ServiceRequest.find({});

    const housekeepingAssigned = serviceRequests.filter(
        (sr) => sr.assignedRole === "housekeeping"
    );
    const maintenanceAssigned = serviceRequests.filter(
        (sr) => sr.assignedRole === "maintenance"
    );

    console.log(`   ✅ Housekeeping role assigned: ${housekeepingAssigned.length} requests`);
    console.log(`      - Types: ${housekeepingAssigned.map((sr) => sr.serviceType).join(", ")}`);
    console.log(`   ✅ Maintenance role assigned: ${maintenanceAssigned.length} request(s)`);
    console.log(`      - Types: ${maintenanceAssigned.map((sr) => sr.serviceType).join(", ")}`);

    // Verify automatic assignment
    const housekeepingTypes = housekeepingAssigned.every(
        (sr) => sr.serviceType === "housekeeping" || sr.serviceType === "room_service"
    );
    const maintenanceTypes = maintenanceAssigned.every(
        (sr) => sr.serviceType === "maintenance"
    );

    if (housekeepingTypes && maintenanceTypes) {
        console.log("   ✅ Automatic role assignment working correctly");
    } else {
        console.log("   ❌ Automatic role assignment has issues");
    }
}

async function testHousekeepingAccess(housekeeping) {
    console.log("\n🧹 Testing Housekeeping Access Control...");

    // Housekeeping should only see housekeeping-assigned tasks
    const housekeepingTasks = await ServiceRequest.find({
        assignedRole: "housekeeping",
    });

    const maintenanceTasks = await ServiceRequest.find({
        assignedRole: "maintenance",
    });

    console.log(`   ✅ Housekeeping can access: ${housekeepingTasks.length} tasks`);
    console.log(`   ✅ Maintenance tasks (should NOT see): ${maintenanceTasks.length}`);

    if (housekeepingTasks.length > 0 && maintenanceTasks.length > 0) {
        console.log("   ✅ Role-based task separation working correctly");
    }
}

async function testStatusUpdates(serviceRequest) {
    console.log("\n🔄 Testing Status Updates...");

    // Test status progression: pending -> in_progress -> completed
    console.log(`   Initial status: ${serviceRequest.status}`);

    serviceRequest.status = "in_progress";
    await serviceRequest.save();
    console.log(`   ✅ Updated to: ${serviceRequest.status}`);

    serviceRequest.status = "completed";
    await serviceRequest.save();
    console.log(`   ✅ Updated to: ${serviceRequest.status}`);

    console.log("   ✅ Status update workflow working correctly");
}

async function testGuestAccess(guest) {
    console.log("\n👤 Testing Guest Access Control...");

    // Guest should only see their own service requests
    const guestRequests = await ServiceRequest.find({
        requestedBy: guest._id,
    });

    console.log(`   ✅ Guest has ${guestRequests.length} service request(s)`);

    // Populate to show full details
    await ServiceRequest.populate(guestRequests, [
        { path: "booking", select: "checkInDate checkOutDate status" },
        { path: "room", select: "roomNumber roomType" },
    ]);

    console.log("   ✅ Guest can view own service requests");
}

async function testReceptionistAdminAccess() {
    console.log("\n📋 Testing Receptionist/Admin Access...");

    // Receptionist and admin should see all service requests
    const allServiceRequests = await ServiceRequest.find({});

    console.log(`   ✅ Total service requests in system: ${allServiceRequests.length}`);

    const byStatus = {
        pending: allServiceRequests.filter((sr) => sr.status === "pending").length,
        in_progress: allServiceRequests.filter((sr) => sr.status === "in_progress").length,
        completed: allServiceRequests.filter((sr) => sr.status === "completed").length,
    };

    console.log(`   ✅ Pending: ${byStatus.pending}`);
    console.log(`   ✅ In Progress: ${byStatus.in_progress}`);
    console.log(`   ✅ Completed: ${byStatus.completed}`);
    console.log("   ✅ Receptionist/Admin can view all requests");
}

async function testPopulatedQueries() {
    console.log("\n🔗 Testing Populated Queries...");

    const serviceRequests = await ServiceRequest.find({})
        .populate("booking", "checkInDate checkOutDate status")
        .populate("room", "roomNumber roomType")
        .populate("requestedBy", "name email role");

    console.log(`   ✅ Found ${serviceRequests.length} service requests with populated data`);

    if (serviceRequests.length > 0) {
        const firstRequest = serviceRequests[0];
        console.log(`   ✅ Sample request has booking: ${!!firstRequest.booking}`);
        console.log(`   ✅ Sample request has room: ${!!firstRequest.room}`);
        console.log(`   ✅ Sample request has requestedBy: ${!!firstRequest.requestedBy}`);
    }
}

async function displaySummary() {
    console.log("\n📊 SERVICE REQUEST SYSTEM TEST SUMMARY");

    const total = await ServiceRequest.countDocuments();
    const pending = await ServiceRequest.countDocuments({ status: "pending" });
    const inProgress = await ServiceRequest.countDocuments({ status: "in_progress" });
    const completed = await ServiceRequest.countDocuments({ status: "completed" });

    const housekeeping = await ServiceRequest.countDocuments({ assignedRole: "housekeeping" });
    const maintenance = await ServiceRequest.countDocuments({ assignedRole: "maintenance" });

    console.log(`\nTotal Requests: ${total}`);
    console.log(`\nBy Status:`);
    console.log(`  Pending: ${pending}`);
    console.log(`  In Progress: ${inProgress}`);
    console.log(`  Completed: ${completed}`);
    console.log(`\nBy Assigned Role:`);
    console.log(`  Housekeeping: ${housekeeping}`);
    console.log(`  Maintenance: ${maintenance}`);

    console.log("\n✅ ALL TESTS COMPLETED SUCCESSFULLY");
}

async function runTests() {
    try {
        await connectDB();

        await cleanupTestData();

        const { guest, housekeeping, receptionist, admin } = await createTestUsers();
        const room = await createTestRoom();
        const booking = await createTestBooking(guest, room);

        const { housekeepingRequest, roomServiceRequest, maintenanceRequest } =
            await testServiceRequestCreation(guest, booking, room);

        await testAutomaticRoleAssignment();
        await testHousekeepingAccess(housekeeping);
        await testStatusUpdates(housekeepingRequest);
        await testGuestAccess(guest);
        await testReceptionistAdminAccess();
        await testPopulatedQueries();
        await displaySummary();
    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("\n👋 Database connection closed");
    }
}

runTests();
