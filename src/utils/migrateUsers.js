/**
 * Migration Script: Add Password Reset Fields to Existing Users
 * 
 * This script adds the newly introduced password reset fields to existing users
 * in the database that don't have them yet.
 * 
 * Run:
 * node src/utils/migrateUsers.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

/**
 * Migrate existing users to include password reset fields
 */
const migrateUsers = async () => {
    try {
        console.log("🔄 USER MIGRATION SCRIPT");
        console.log("=".repeat(60));
        console.log("Purpose: Add password reset fields to existing users");
        console.log("=".repeat(60));

        // Check for MongoDB URI
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            console.error("\n❌ Error: MongoDB connection string is missing!");
            console.error("Please set MONGO_URI in your .env file");
            process.exit(1);
        }

        // Connect to database
        console.log("\n📡 Connecting to MongoDB...");
        await mongoose.connect(mongoURI);
        console.log("✅ Connected to MongoDB");

        // Find users missing the new fields
        console.log("\n🔍 Scanning for users to migrate...");

        // Find all users where resetOtp or resetOtpExpireAt don't exist
        const usersToMigrate = await User.find({
            $or: [
                { resetOtp: { $exists: false } },
                { resetOtpExpireAt: { $exists: false } }
            ]
        });

        const totalUsers = await User.countDocuments();
        const usersNeedingMigration = usersToMigrate.length;

        console.log(`   Total users in database: ${totalUsers}`);
        console.log(`   Users needing migration: ${usersNeedingMigration}`);

        if (usersNeedingMigration === 0) {
            console.log("\n✅ All users are already up to date!");
            console.log("No migration needed.");

            await mongoose.connection.close();
            console.log("\n👋 Database connection closed");
            process.exit(0);
        }

        // Perform migration
        console.log("\n🔧 Starting migration...");
        console.log("-".repeat(60));

        let migratedCount = 0;
        let errorCount = 0;

        for (const user of usersToMigrate) {
            try {
                // Only set fields if they don't exist (idempotent)
                if (user.resetOtp === undefined) {
                    user.resetOtp = null;
                }
                if (user.resetOtpExpireAt === undefined) {
                    user.resetOtpExpireAt = null;
                }

                // Save without triggering password rehashing
                await user.save();

                migratedCount++;
                console.log(`   ✅ Migrated user: ${user.email} (${user.role})`);
            } catch (error) {
                errorCount++;
                console.error(`   ❌ Failed to migrate user: ${user.email}`);
                console.error(`      Error: ${error.message}`);
            }
        }

        // Summary
        console.log("\n" + "=".repeat(60));
        console.log("📊 MIGRATION SUMMARY");
        console.log("=".repeat(60));
        console.log(`Total users scanned: ${totalUsers}`);
        console.log(`Users needing migration: ${usersNeedingMigration}`);
        console.log(`Successfully migrated: ${migratedCount}`);
        console.log(`Failed: ${errorCount}`);
        console.log("=".repeat(60));

        if (errorCount === 0) {
            console.log("\n🎉 Migration completed successfully!");
            console.log("✅ All users now have password reset fields");
        } else {
            console.log(`\n⚠️  Migration completed with ${errorCount} error(s)`);
            console.log("Please review the errors above");
        }

        // Close database connection
        await mongoose.connection.close();
        console.log("\n👋 Database connection closed");

        process.exit(errorCount > 0 ? 1 : 0);
    } catch (error) {
        console.error("\n❌ Migration failed:", error.message);
        console.error(error.stack);

        // Close database connection if it was opened
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log("👋 Database connection closed");
        }

        process.exit(1);
    }
};

// Run the migration
migrateUsers();

