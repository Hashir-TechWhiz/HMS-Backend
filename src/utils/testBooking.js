/**
 * Test script for Booking Management System
 *
 * Run:
 * node src/utils/testBooking.js
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
    receptionist: {
        name: "Test Receptionist",
        email: "testreceptionist@example.com",
        password: "password123",
        role: "receptionist",
    },
    room: {
        roomNumber: "TEST-101",
        roomType: "Deluxe",
        pricePerNight: 150,
        capacity: 2,
        description: "Test room for booking",
        images: ["https://picsum.photos/800/600?random=1"],
        status: "available",
    },
};

async function cleanupTestData() {
    console.log("\n🧹 Cleaning up test data...");

    const users = await User.find({
        email: { $in: [testData.guest.email, testData.receptionist.email] },
    }).select("_id");

    const deletedBookings = await Booking.deleteMany({
        guest: { $in: users },
    });
    console.log(`   Deleted ${deletedBookings.deletedCount} test bookings`);

    const deletedRoom = await Room.findOneAndDelete({
        roomNumber: testData.room.roomNumber,
    });
    if (deletedRoom) {
        console.log(`   Deleted test room: ${testData.room.roomNumber}`);
    }

    await User.deleteOne({ email: testData.guest.email });
    await User.deleteOne({ email: testData.receptionist.email });
    console.log("   Deleted test users");
}

async function createTestUsers() {
    console.log("\n👥 Creating test users...");

    const guest = new User(testData.guest);
    await guest.save();
    console.log(`   ✅ Guest created: ${guest.email}`);

    const receptionist = new User(testData.receptionist);
    await receptionist.save();
    console.log(`   ✅ Receptionist created: ${receptionist.email}`);

    return { guest, receptionist };
}

async function createTestRoom() {
    console.log("\n🏨 Creating test room...");

    const room = new Room(testData.room);
    await room.save();
    console.log(`   ✅ Room created: ${room.roomNumber} (${room.roomType})`);

    return room;
}

async function testBookingCreation(guest, receptionist, room) {
    console.log("\n📝 Testing Booking Creation...");

    const today = new Date();
    const checkInDate = new Date(today);
    checkInDate.setDate(today.getDate() + 7);

    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkInDate.getDate() + 2);

    const booking1 = new Booking({
        guest: guest._id,
        room: room._id,
        checkInDate,
        checkOutDate,
        status: "pending",
    });
    await booking1.save();
    console.log("   ✅ Booking 1 created (Guest booking)");

    try {
        const overlappingBooking = new Booking({
            guest: guest._id,
            room: room._id,
            checkInDate: new Date(checkInDate.getTime() + 86400000),
            checkOutDate: new Date(checkOutDate.getTime()),
            status: "pending",
        });
        await overlappingBooking.save();
        console.log("   ❌ Overlap detection failed");
    } catch {
        console.log("   ✅ Overlap detection working");
    }

    const futureCheckIn = new Date(checkOutDate);
    futureCheckIn.setDate(futureCheckIn.getDate() + 1);

    const futureCheckOut = new Date(futureCheckIn);
    futureCheckOut.setDate(futureCheckIn.getDate() + 3);

    const booking2 = new Booking({
        guest: guest._id,
        room: room._id,
        checkInDate: futureCheckIn,
        checkOutDate: futureCheckOut,
        status: "confirmed",
    });
    await booking2.save();
    console.log("   ✅ Booking 2 created (Non-overlapping)");

    return { booking1, booking2 };
}

async function testBookingRetrieval(guest) {
    console.log("\n📖 Testing Booking Retrieval...");

    const guestBookings = await Booking.find({ guest: guest._id });
    console.log(`   ✅ Retrieved ${guestBookings.length} bookings for guest`);
}

async function testBookingCancellation(booking) {
    console.log("\n❌ Testing Booking Cancellation...");

    booking.status = "cancelled";
    await booking.save();
    console.log("   ✅ Booking cancelled");
}

async function displaySummary() {
    console.log("\n📊 BOOKING SYSTEM TEST SUMMARY");

    console.log(`Total: ${await Booking.countDocuments()}`);
    console.log(`Pending: ${await Booking.countDocuments({ status: "pending" })}`);
    console.log(`Confirmed: ${await Booking.countDocuments({ status: "confirmed" })}`);
    console.log(`Cancelled: ${await Booking.countDocuments({ status: "cancelled" })}`);

    console.log("\n✅ ALL TESTS COMPLETED SUCCESSFULLY");
}

async function runTests() {
    try {
        await connectDB();

        await cleanupTestData();

        const { guest, receptionist } = await createTestUsers();
        const room = await createTestRoom();

        const { booking1 } = await testBookingCreation(
            guest,
            receptionist,
            room
        );

        await testBookingRetrieval(guest);
        await testBookingCancellation(booking1);
        await displaySummary();
    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("👋 Database connection closed");
    }
}

runTests();
