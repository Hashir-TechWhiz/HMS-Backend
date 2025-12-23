import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

/**
 * Script to create an initial admin user
 * Usage: node src/utils/createAdmin.js
 */
const createAdminUser = async () => {
    try {
        // Check for MongoDB URI (support both MONGODB_URI and MONGO_URI)
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            console.error("\n❌ Error: MongoDB connection string is missing!");
            process.exit(1);
        }

        // Connect to database
        await mongoose.connect(mongoURI);
        console.log("✅ Connected to MongoDB");

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: "admin" });

        if (existingAdmin) {
            console.log("\n Admin user already exists:");
            console.log(`Email: ${existingAdmin.email}`);
            console.log(`Name: ${existingAdmin.name}`);
            console.log("\nIf you want to create a new admin, delete this one first.");

            // Close database connection
            await mongoose.connection.close();
            process.exit(0);
        }

        // Create admin user
        const adminData = {
            name: process.env.ADMIN_NAME || "System Admin",
            email: process.env.ADMIN_EMAIL || "admin@hotel.com",
            password: process.env.ADMIN_PASSWORD || "admin123456",
            role: "admin",
            isActive: true,
        };

        const admin = new User(adminData);
        await admin.save();

        console.log("\n✅ Admin user created successfully!");
        console.log("==========================================");
        console.log(`Name: ${admin.name}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Role: ${admin.role}`);
        console.log("==========================================");

        // Close database connection
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error creating admin user:", error.message);

        // Close database connection if it was opened
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
};

// Run the script
createAdminUser();

