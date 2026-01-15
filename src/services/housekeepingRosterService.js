import HousekeepingRoster from "../models/HousekeepingRoster.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import mongoose from "mongoose";

class HousekeepingRosterService {
    /**
     * Generate daily housekeeping tasks for all rooms in a hotel
     * ATOMIC: Creates ALL 3 sessions (MORNING, AFTERNOON, EVENING) per room at once
     * @param {string} hotelId - Hotel ID
     * @param {Date} date - Date for which to generate tasks
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Generation summary
     */
    async generateDailyTasks(hotelId, date, currentUser) {
        // Only admin can generate daily tasks
        if (currentUser.role !== "admin") {
            throw new Error("Only admin can generate daily housekeeping tasks");
        }

        // Validate hotelId
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            throw new Error("Invalid hotel ID");
        }

        // Parse and validate date
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);

        if (isNaN(taskDate.getTime())) {
            throw new Error("Invalid date format");
        }

        // Get ALL rooms for the hotel (regardless of status as per requirements)
        const rooms = await Room.find({ hotelId });

        if (rooms.length === 0) {
            throw new Error("No rooms found for this hotel");
        }

        // Get all housekeeping staff for the hotel
        const housekeepingStaff = await User.find({
            hotelId,
            role: "housekeeping",
            isActive: true,
        });

        // All 3 sessions per day
        const sessions = ["MORNING", "AFTERNOON", "EVENING"];
        const roomsProcessed = [];
        const roomsSkipped = [];

        // Process each room atomically (all 3 sessions together)
        for (const room of rooms) {
            try {
                // Check if ANY session already exists for this room on this date
                const existingSessions = await HousekeepingRoster.find({
                    hotelId,
                    room: room._id,
                    date: taskDate,
                });

                if (existingSessions.length > 0) {
                    roomsSkipped.push({
                        room: room.roomNumber,
                        reason: `${existingSessions.length} session(s) already exist`,
                        existingSessions: existingSessions.map(s => s.session),
                    });
                    continue;
                }


                // Create all 3 sessions atomically with automatic assignment
                const sessionsToCreate = [];

                // Calculate current workload for each staff member for fair distribution
                let staffWorkload = [];
                if (housekeepingStaff.length > 0) {
                    staffWorkload = await Promise.all(
                        housekeepingStaff.map(async (staff) => {
                            const pendingTasks = await HousekeepingRoster.countDocuments({
                                hotelId,
                                assignedTo: staff._id,
                                date: taskDate,
                                status: { $in: ["pending", "in_progress"] }
                            });
                            return { staffId: staff._id, staffName: staff.name, pendingTasks };
                        })
                    );
                    // Sort by workload (least tasks first)
                    staffWorkload.sort((a, b) => a.pendingTasks - b.pendingTasks);
                }

                for (let i = 0; i < sessions.length; i++) {
                    const session = sessions[i];

                    // Automatically assign to housekeeper with least workload
                    let assignedStaff = null;
                    let assignedStaffName = null;

                    if (staffWorkload.length > 0) {
                        // Get staff with least workload and increment their count
                        const selectedStaff = staffWorkload[0];
                        assignedStaff = selectedStaff.staffId;
                        assignedStaffName = selectedStaff.staffName;

                        // Increment workload for next iteration
                        selectedStaff.pendingTasks++;
                        // Re-sort to maintain least-workload-first order
                        staffWorkload.sort((a, b) => a.pendingTasks - b.pendingTasks);
                    }

                    sessionsToCreate.push({
                        hotelId,
                        room: room._id,
                        date: taskDate,
                        session,
                        assignedTo: assignedStaff,
                        status: "pending",
                        priority: "normal",
                        taskType: "routine",
                    });
                }

                // Insert all 3 sessions at once (atomic operation)
                await HousekeepingRoster.insertMany(sessionsToCreate, { ordered: true });

                roomsProcessed.push({
                    room: room.roomNumber,
                    roomType: room.roomType,
                    status: room.status,
                    sessionsCreated: sessions.length,
                    autoAssigned: staffWorkload.length > 0,
                });
            } catch (error) {
                // Handle duplicate key errors gracefully
                if (error.code === 11000) {
                    roomsSkipped.push({
                        room: room.roomNumber,
                        reason: "Duplicate session detected (concurrent creation)",
                    });
                } else {
                    // Log error but continue with other rooms
                    console.error(`Error creating sessions for room ${room.roomNumber}:`, error.message);
                    roomsSkipped.push({
                        room: room.roomNumber,
                        reason: `Error: ${error.message}`,
                    });
                }
            }
        }


        const autoAssignedCount = roomsProcessed.filter(r => r.autoAssigned).length;

        return {
            message: housekeepingStaff.length > 0
                ? `Daily housekeeping tasks generated and automatically assigned successfully`
                : `Daily housekeeping tasks generated successfully (no housekeepers available for auto-assignment)`,
            date: taskDate,
            roomsProcessed: roomsProcessed.length,
            roomsSkipped: roomsSkipped.length,
            totalSessionsCreated: roomsProcessed.length * 3,
            autoAssignedRooms: autoAssignedCount,
            availableHousekeepers: housekeepingStaff.length,
            details: {
                processed: roomsProcessed,
                skipped: roomsSkipped,
            },
        };
    }

    /**
     * Create a checkout cleaning task
     * @param {string} hotelId - Hotel ID
     * @param {string} roomId - Room ID
     * @returns {Object} Created task
     */
    async createCheckoutCleaningTask(hotelId, roomId) {
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            throw new Error("Invalid hotel ID");
        }
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            throw new Error("Invalid room ID");
        }

        // Get room details
        const room = await Room.findById(roomId);
        if (!room) {
            throw new Error("Room not found");
        }

        // Verify room belongs to hotel
        if (room.hotelId.toString() !== hotelId.toString()) {
            throw new Error("Room does not belong to this hotel");
        }

        // Get available housekeeping staff for this hotel
        const housekeepingStaff = await User.find({
            hotelId,
            role: "housekeeping",
            isActive: true,
        });

        // Assign to first available staff (or leave unassigned)
        let assignedStaff = null;
        if (housekeepingStaff.length > 0) {
            // Find staff with least pending tasks
            const staffWorkload = await Promise.all(
                housekeepingStaff.map(async (staff) => {
                    const pendingTasks = await HousekeepingRoster.countDocuments({
                        hotelId,
                        assignedTo: staff._id,
                        status: "pending",
                    });
                    return { staffId: staff._id, pendingTasks };
                })
            );

            // Sort by workload and assign to staff with least tasks
            staffWorkload.sort((a, b) => a.pendingTasks - b.pendingTasks);
            assignedStaff = staffWorkload[0].staffId;
        }

        // Create high-priority checkout cleaning task
        const cleaningTask = new HousekeepingRoster({
            hotelId,
            room: roomId,
            date: new Date(),
            session: this.getCurrentSession(),
            assignedTo: assignedStaff,
            status: "pending",
            priority: "high",
            taskType: "checkout_cleaning",
            notes: "Automatic checkout cleaning request",
        });

        await cleaningTask.save();

        // Populate references
        await cleaningTask.populate([
            { path: "room", select: "roomNumber roomType" },
            { path: "assignedTo", select: "name email role" },
        ]);

        return cleaningTask.toJSON();
    }

    /**
     * Get current session based on time of day
     * @returns {string} Current session
     */
    getCurrentSession() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 14) {
            return "MORNING";
        } else if (hour >= 14 && hour < 22) {
            return "AFTERNOON";
        } else {
            return "EVENING";
        }
    }

    /**
     * Get housekeeping tasks for a specific date
     * @param {string} hotelId - Hotel ID (optional for admin, required for housekeeping)
     * @param {Date} date - Date
     * @param {Object} filters - Optional filters (session, status, assignedTo)
     * @param {Object} currentUser - Current user making the request
     * @returns {Array} Housekeeping tasks
     */
    async getTasksByDate(hotelId, date, filters = {}, currentUser) {
        // Parse date
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);

        if (isNaN(taskDate.getTime())) {
            throw new Error("Invalid date format");
        }

        const query = { date: taskDate };

        // Role-based filtering
        if (currentUser.role === "housekeeping") {
            // Housekeeping can only see their own tasks
            query.assignedTo = currentUser.id;
            query.hotelId = currentUser.hotelId;
        } else if (currentUser.role === "admin" || currentUser.role === "receptionist") {
            // Admin and receptionist can see all tasks for their hotel
            if (hotelId) {
                if (!mongoose.Types.ObjectId.isValid(hotelId)) {
                    throw new Error("Invalid hotel ID");
                }
                query.hotelId = hotelId;
            }
        } else {
            throw new Error("Unauthorized to view housekeeping tasks");
        }

        // Apply filters
        if (filters.session) {
            query.session = filters.session;
        }
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.assignedTo && (currentUser.role === "admin" || currentUser.role === "receptionist")) {
            query.assignedTo = filters.assignedTo;
        }

        const tasks = await HousekeepingRoster.find(query)
            .populate("room", "roomNumber roomType")
            .populate("assignedTo", "name email role")
            .sort({ session: 1, priority: -1 });

        return tasks.map((task) => task.toJSON());
    }

    /**
     * Update housekeeping task status
     * @param {string} taskId - Task ID
     * @param {string} newStatus - New status
     * @param {string} notes - Optional notes
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Updated task
     */
    async updateTaskStatus(taskId, newStatus, notes, currentUser) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            throw new Error("Invalid task ID");
        }

        // Validate status
        const validStatuses = ["pending", "in_progress", "completed", "skipped"];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
        }

        const task = await HousekeepingRoster.findById(taskId)
            .populate("room", "roomNumber roomType")
            .populate("assignedTo", "name email role");

        if (!task) {
            throw new Error("Task not found");
        }

        // Authorization check
        if (currentUser.role === "housekeeping") {
            // Housekeeping can only update their own assigned tasks
            if (!task.assignedTo || task.assignedTo._id.toString() !== currentUser.id) {
                throw new Error("Access denied. You can only update tasks assigned to you");
            }
        } else if (currentUser.role !== "admin" && currentUser.role !== "receptionist") {
            throw new Error("Unauthorized to update housekeeping tasks");
        }

        // Update task
        task.status = newStatus;
        if (notes) {
            task.notes = notes;
        }

        await task.save();

        return task.toJSON();
    }

    /**
     * Assign task to housekeeping staff
     * @param {string} taskId - Task ID
     * @param {string} staffId - Staff ID
     * @param {Object} currentUser - Current user making the request
     * @returns {Object} Updated task
     */
    async assignTask(taskId, staffId, currentUser) {
        // Only admin can assign tasks
        if (currentUser.role !== "admin") {
            throw new Error("Only admin can assign housekeeping tasks");
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            throw new Error("Invalid task ID");
        }
        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            throw new Error("Invalid staff ID");
        }

        const task = await HousekeepingRoster.findById(taskId);
        if (!task) {
            throw new Error("Task not found");
        }

        // Verify staff member exists and has correct role
        const staffMember = await User.findById(staffId);
        if (!staffMember) {
            throw new Error("Staff member not found");
        }

        if (staffMember.role !== "housekeeping") {
            throw new Error("Staff member must have housekeeping role");
        }

        // Verify staff belongs to the same hotel
        if (task.hotelId.toString() !== staffMember.hotelId.toString()) {
            throw new Error("Cannot assign staff from a different hotel");
        }

        // Assign task
        task.assignedTo = staffId;
        await task.save();

        // Populate references
        await task.populate([
            { path: "room", select: "roomNumber roomType" },
            { path: "assignedTo", select: "name email role" },
        ]);

        return task.toJSON();
    }

    /**
     * Get my tasks (for housekeeping staff)
     * @param {Object} currentUser - Current user making the request
     * @param {Object} filters - Optional filters (date, session, status)
     * @returns {Array} Assigned tasks
     */
    async getMyTasks(currentUser, filters = {}) {
        if (currentUser.role !== "housekeeping") {
            throw new Error("This endpoint is only for housekeeping staff");
        }

        const query = {
            hotelId: currentUser.hotelId,
            assignedTo: currentUser._id || currentUser.id,
        };

        // Apply filters
        if (filters.date) {
            const taskDate = new Date(filters.date);
            taskDate.setHours(0, 0, 0, 0);
            if (!isNaN(taskDate.getTime())) {
                query.date = taskDate;
            }
        } else {
            // Default to today's tasks
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query.date = today;
        }

        if (filters.session) {
            query.session = filters.session;
        }
        if (filters.status) {
            query.status = filters.status;
        }

        const tasks = await HousekeepingRoster.find(query)
            .populate("room", "roomNumber roomType")
            .sort({ session: 1, priority: -1 });

        return tasks.map((task) => task.toJSON());
    }

    /**
     * Get cleaning sessions (roster view for admin)
     * @param {string} hotelId - Hotel ID
     * @param {Date} date - Date
     * @param {Object} filters - Optional filters (session, status, roomId)
     * @param {Object} currentUser - Current user making the request
     * @returns {Array} Cleaning sessions with room and staff details
     */
    async getCleaningSessions(hotelId, date, filters = {}, currentUser) {
        // Only admin can access roster view
        if (currentUser.role !== "admin") {
            throw new Error("Only admin can access cleaning roster");
        }

        // Validate hotelId
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            throw new Error("Invalid hotel ID");
        }

        // Parse date (default to today)
        const taskDate = date ? new Date(date) : new Date();
        taskDate.setHours(0, 0, 0, 0);

        if (isNaN(taskDate.getTime())) {
            throw new Error("Invalid date format");
        }

        const query = {
            hotelId,
            date: taskDate,
        };

        // Apply filters
        if (filters.session) {
            query.session = filters.session;
        }
        if (filters.status) {
            query.status = filters.status;
        }
        if (filters.roomId) {
            query.room = filters.roomId;
        }

        const sessions = await HousekeepingRoster.find(query)
            .populate("room", "roomNumber roomType status")
            .populate("assignedTo", "name email role")
            .populate("hotelId", "name code")
            .sort({ "room.roomNumber": 1, session: 1 });

        return sessions.map((session) => session.toJSON());
    }
}

export default new HousekeepingRosterService();
