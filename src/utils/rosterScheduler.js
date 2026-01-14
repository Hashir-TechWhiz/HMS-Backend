import cron from "node-cron";
import Hotel from "../models/Hotel.js";
import housekeepingRosterService from "../services/housekeepingRosterService.js";

/**
 * Automated Daily Housekeeping Roster Generation
 * 
 * This cron job runs every day at midnight (00:00) and automatically generates
 * housekeeping tasks for all active hotels.
 * 
 * For each hotel, it creates 3 tasks per room (morning, afternoon, night shift)
 * and assigns them to housekeeping staff using round-robin distribution.
 */

class RosterScheduler {
    constructor() {
        this.job = null;
    }

    /**
     * Start the automated roster generation scheduler
     */
    start() {
        // Run every day at midnight (00:00)
        // Cron format: second minute hour day month weekday
        this.job = cron.schedule("0 0 * * *", async () => {
            console.log("[Roster Scheduler] Starting automated daily roster generation...");
            await this.generateDailyRostersForAllHotels();
        });

        console.log("[Roster Scheduler] Automated roster generation scheduled (runs daily at midnight)");
    }

    /**
     * Stop the scheduler
     */
    stop() {
        if (this.job) {
            this.job.stop();
            console.log("[Roster Scheduler] Roster generation scheduler stopped");
        }
    }

    /**
     * Generate daily rosters for all active hotels
     */
    async generateDailyRostersForAllHotels() {
        try {
            // Get all active hotels
            const hotels = await Hotel.find({ isActive: true });

            if (hotels.length === 0) {
                console.log("[Roster Scheduler] No active hotels found");
                return;
            }

            console.log(`[Roster Scheduler] Found ${hotels.length} active hotel(s)`);

            // Generate tasks for tomorrow (so staff can see their schedule in advance)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const results = [];

            // Create a system user context for automated generation
            const systemUser = {
                id: "system",
                role: "admin",
            };

            for (const hotel of hotels) {
                try {
                    console.log(`[Roster Scheduler] Generating tasks for hotel: ${hotel.name} (${hotel.code})`);

                    const result = await housekeepingRosterService.generateDailyTasks(
                        hotel._id.toString(),
                        tomorrow,
                        systemUser
                    );

                    results.push({
                        hotel: hotel.name,
                        success: true,
                        ...result,
                    });

                    console.log(
                        `[Roster Scheduler] ✓ Hotel ${hotel.name}: Created ${result.tasksCreated} tasks, Skipped ${result.tasksSkipped} tasks`
                    );
                } catch (error) {
                    console.error(`[Roster Scheduler] ✗ Error generating tasks for hotel ${hotel.name}:`, error.message);
                    results.push({
                        hotel: hotel.name,
                        success: false,
                        error: error.message,
                    });
                }
            }

            // Summary
            const successful = results.filter((r) => r.success).length;
            const failed = results.filter((r) => !r.success).length;
            const totalTasksCreated = results
                .filter((r) => r.success)
                .reduce((sum, r) => sum + r.tasksCreated, 0);

            console.log("[Roster Scheduler] ========================================");
            console.log(`[Roster Scheduler] Daily roster generation completed`);
            console.log(`[Roster Scheduler] Hotels processed: ${hotels.length}`);
            console.log(`[Roster Scheduler] Successful: ${successful}`);
            console.log(`[Roster Scheduler] Failed: ${failed}`);
            console.log(`[Roster Scheduler] Total tasks created: ${totalTasksCreated}`);
            console.log("[Roster Scheduler] ========================================");

            return results;
        } catch (error) {
            console.error("[Roster Scheduler] Fatal error in roster generation:", error);
            throw error;
        }
    }

    /**
     * Manually trigger roster generation (for testing or manual runs)
     */
    async triggerManual() {
        console.log("[Roster Scheduler] Manual roster generation triggered");
        return await this.generateDailyRostersForAllHotels();
    }
}

// Create singleton instance
const rosterScheduler = new RosterScheduler();

export default rosterScheduler;
