import mongoose from "mongoose";
import dotenv from "dotenv";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import ServiceRequest from "../models/ServiceRequest.js";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

/**
 * Migration script to add multi-hotel support
 * 
 * This script:
 * 1. Creates a default hotel
 * 2. Assigns all existing rooms, bookings, and service requests to the default hotel
 * 3. Does NOT modify users (hotelId for users is optional for existing data)
 */

async function migrateToMultiHotel() {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGO_URI_TEST2 || process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error("MongoDB URI not found in environment variables. Please set MONGO_URI_TEST2 or MONGODB_URI");
        }

        await mongoose.connect(mongoURI);
        console.log("✓ Connected to MongoDB");

        // Check if default hotel already exists
        let defaultHotel = await Hotel.findOne({ code: "HMS-001" });

        if (!defaultHotel) {
            // Create default hotel
            defaultHotel = new Hotel({
                name: "Default Hotel",
                code: "HMS-001",
                address: "123 Main Street",
                city: "Default City",
                country: "Default Country",
                contactEmail: "contact@defaulthotel.com",
                contactPhone: "+1234567890",
                status: "Active",
            });

            await defaultHotel.save();
            console.log("✓ Created default hotel:", defaultHotel.name);
        } else {
            console.log("✓ Default hotel already exists:", defaultHotel.name);
        }

        // Create admin user if not exists
        const adminEmail = "nasiknsk38@gmail.com";
        let adminUser = await User.findOne({ email: adminEmail });

        if (!adminUser) {
            adminUser = new User({
                name: "Admin User",
                email: adminEmail,
                password: "123456", // Will be hashed by pre-save hook
                role: "admin",
                isActive: true,
            });

            await adminUser.save();
            console.log("✓ Created admin user:", adminEmail);
        } else {
            console.log("✓ Admin user already exists:", adminEmail);
        }

        // Migrate Rooms
        const roomsWithoutHotel = await Room.countDocuments({ hotelId: { $exists: false } });
        if (roomsWithoutHotel > 0) {
            await Room.updateMany(
                { hotelId: { $exists: false } },
                { $set: { hotelId: defaultHotel._id } }
            );
            console.log(`✓ Migrated ${roomsWithoutHotel} rooms to default hotel`);
        } else {
            console.log("✓ All rooms already have hotelId");
        }

        // Migrate Bookings
        const bookingsWithoutHotel = await Booking.countDocuments({ hotelId: { $exists: false } });
        if (bookingsWithoutHotel > 0) {
            await Booking.updateMany(
                { hotelId: { $exists: false } },
                { $set: { hotelId: defaultHotel._id } }
            );
            console.log(`✓ Migrated ${bookingsWithoutHotel} bookings to default hotel`);
        } else {
            console.log("✓ All bookings already have hotelId");
        }

        // Migrate Service Requests
        const serviceRequestsWithoutHotel = await ServiceRequest.countDocuments({ hotelId: { $exists: false } });
        if (serviceRequestsWithoutHotel > 0) {
            await ServiceRequest.updateMany(
                { hotelId: { $exists: false } },
                { $set: { hotelId: defaultHotel._id } }
            );
            console.log(`✓ Migrated ${serviceRequestsWithoutHotel} service requests to default hotel`);
        } else {
            console.log("✓ All service requests already have hotelId");
        }

        // Note: We don't automatically assign users to hotels
        // Receptionist and housekeeping users should be manually assigned to hotels by admin
        const staffWithoutHotel = await User.countDocuments({
            role: { $in: ["receptionist", "housekeeping"] },
            hotelId: { $exists: false }
        });

        if (staffWithoutHotel > 0) {
            console.log(`⚠ Warning: ${staffWithoutHotel} staff members (receptionist/housekeeping) don't have hotelId`);
            console.log("  Admin should manually assign these users to hotels via the admin panel");
        }

        console.log("\n✓ Migration completed successfully!");
        console.log("\nNext steps:");
        console.log("1. Admin can create additional hotels via the admin panel");
        console.log("2. Admin should assign receptionist/housekeeping staff to specific hotels");
        console.log("3. New rooms, bookings, and service requests will be hotel-scoped");

    } catch (error) {
        console.error("✗ Migration failed:", error.message);
        throw error;
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log("\n✓ Database connection closed");
    }
}

// Run migration
migrateToMultiHotel()
    .then(() => {
        console.log("\n✓ Migration script completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n✗ Migration script failed:", error);
        process.exit(1);
    });
