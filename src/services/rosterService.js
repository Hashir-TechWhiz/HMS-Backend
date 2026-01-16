import Roster from "../models/Roster.js";
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";

class RosterService {
    /**
     * Create a new roster entry
     * Admin only
     */
    async createRoster(rosterData, currentUser) {
        try {
            // Only admin can create rosters
            if (currentUser.role !== "admin") {
                throw new Error("Only admins can create roster entries");
            }

            const { hotelId, staffId, date, shiftType, shiftStartTime, shiftEndTime, role, notes } = rosterData;

            // Validate required fields
            if (!hotelId || !staffId || !date || !shiftType || !shiftStartTime || !shiftEndTime || !role) {
                throw new Error("All required fields must be provided");
            }

            // Verify hotel exists
            const hotel = await Hotel.findById(hotelId);
            if (!hotel) {
                throw new Error("Hotel not found");
            }

            // Verify staff exists and is a staff member (receptionist or housekeeping)
            const staff = await User.findById(staffId);
            if (!staff) {
                throw new Error("Staff member not found");
            }

            if (!["receptionist", "housekeeping"].includes(staff.role)) {
                throw new Error("Only receptionist or housekeeping staff can be rostered");
            }

            // Verify staff belongs to the specified hotel
            if (staff.hotelId && staff.hotelId.toString() !== hotelId.toString()) {
                throw new Error("Staff member does not belong to the specified hotel");
            }

            // Verify role matches staff's actual role
            if (staff.role !== role) {
                throw new Error("Roster role must match staff member's actual role");
            }

            // Check for overlapping shifts
            const hasOverlap = await Roster.checkOverlappingShifts(staffId, date, shiftType);
            if (hasOverlap) {
                throw new Error("Staff member already has a shift assigned for this date and shift type");
            }

            // Create roster entry
            const roster = await Roster.create({
                hotelId,
                staffId,
                date: new Date(date),
                shiftType,
                shiftStartTime,
                shiftEndTime,
                role,
                notes: notes || "",
            });

            // Populate staff and hotel details
            await roster.populate([
                { path: "staffId", select: "name email role" },
                { path: "hotelId", select: "name code city" },
            ]);

            return roster;
        } catch (error) {
            // Handle MongoDB duplicate key error (E11000)
            if (error.code === 11000 && error.keyPattern && error.keyPattern.staffId) {
                throw new Error(`This staff member already has a ${shiftType || 'shift'} assigned for this date. Please choose a different shift type or edit the existing shift.`);
            }
            throw error;
        }
    }

    /**
     * Get all roster entries with filters
     * Admin: can view all rosters
     * Staff: can only view their own rosters
     */
    async getAllRosters(filters, pagination, currentUser) {
        try {
            const { hotelId, staffId, date, shiftType, role, from, to } = filters;
            const { page = 1, limit = 50 } = pagination;

            // Build query based on user role
            let query = { isActive: true };

            // Staff can only see their own rosters
            if (currentUser.role === "receptionist" || currentUser.role === "housekeeping") {
                query.staffId = currentUser.id;
                
                // Staff can only see rosters for their hotel
                if (currentUser.hotelId) {
                    query.hotelId = currentUser.hotelId;
                }
            }

            // Admin can filter by any criteria
            if (currentUser.role === "admin") {
                if (hotelId) query.hotelId = hotelId;
                if (staffId) query.staffId = staffId;
            }

            // Common filters for all roles
            if (shiftType) query.shiftType = shiftType;
            if (role) query.role = role;

            // Date filtering
            if (date) {
                // Exact date match
                query.date = new Date(date);
            } else if (from || to) {
                // Date range filtering
                query.date = {};
                if (from) query.date.$gte = new Date(from);
                if (to) query.date.$lte = new Date(to);
            }

            // Calculate pagination
            const skip = (page - 1) * limit;

            // Execute query with pagination
            const rosters = await Roster.find(query)
                .populate("staffId", "name email role")
                .populate("hotelId", "name code city")
                .sort({ date: 1, shiftStartTime: 1 })
                .skip(skip)
                .limit(parseInt(limit));

            // Get total count for pagination
            const total = await Roster.countDocuments(query);

            return {
                rosters,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit),
                },
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get roster by ID
     * Admin: can view any roster
     * Staff: can only view their own roster
     */
    async getRosterById(rosterId, currentUser) {
        try {
            const roster = await Roster.findById(rosterId)
                .populate("staffId", "name email role")
                .populate("hotelId", "name code city");

            if (!roster) {
                throw new Error("Roster entry not found");
            }

            // Staff can only view their own rosters
            if (
                (currentUser.role === "receptionist" || currentUser.role === "housekeeping") &&
                roster.staffId._id.toString() !== currentUser.id
            ) {
                throw new Error("You can only view your own roster entries");
            }

            return roster;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update roster entry
     * Admin only
     */
    async updateRoster(rosterId, updateData, currentUser) {
        try {
            // Only admin can update rosters
            if (currentUser.role !== "admin") {
                throw new Error("Only admins can update roster entries");
            }

            const roster = await Roster.findById(rosterId);

            if (!roster) {
                throw new Error("Roster entry not found");
            }

            const { hotelId, staffId, date, shiftType, shiftStartTime, shiftEndTime, role, notes } = updateData;

            // If changing staff, verify staff exists and belongs to hotel
            if (staffId && staffId !== roster.staffId.toString()) {
                const staff = await User.findById(staffId);
                if (!staff) {
                    throw new Error("Staff member not found");
                }

                if (!["receptionist", "housekeeping"].includes(staff.role)) {
                    throw new Error("Only receptionist or housekeeping staff can be rostered");
                }

                const targetHotelId = hotelId || roster.hotelId;
                if (staff.hotelId && staff.hotelId.toString() !== targetHotelId.toString()) {
                    throw new Error("Staff member does not belong to the specified hotel");
                }

                roster.staffId = staffId;
            }

            // If changing date or shift type, check for overlaps
            if (
                (date && date !== roster.date.toISOString().split("T")[0]) ||
                (shiftType && shiftType !== roster.shiftType)
            ) {
                const targetStaffId = staffId || roster.staffId;
                const targetDate = date || roster.date;
                const targetShiftType = shiftType || roster.shiftType;

                const hasOverlap = await Roster.checkOverlappingShifts(
                    targetStaffId,
                    targetDate,
                    targetShiftType,
                    rosterId
                );

                if (hasOverlap) {
                    throw new Error("Staff member already has a shift assigned for this date and shift type");
                }
            }

            // Update fields
            if (hotelId) roster.hotelId = hotelId;
            if (date) roster.date = new Date(date);
            if (shiftType) roster.shiftType = shiftType;
            if (shiftStartTime) roster.shiftStartTime = shiftStartTime;
            if (shiftEndTime) roster.shiftEndTime = shiftEndTime;
            if (role) roster.role = role;
            if (notes !== undefined) roster.notes = notes;

            await roster.save();

            // Populate and return
            await roster.populate([
                { path: "staffId", select: "name email role" },
                { path: "hotelId", select: "name code city" },
            ]);

            return roster;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete roster entry (hard delete - permanently removes from database)
     * Admin only
     */
    async deleteRoster(rosterId, currentUser) {
        try {
            // Only admin can delete rosters
            if (currentUser.role !== "admin") {
                throw new Error("Only admins can delete roster entries");
            }

            const roster = await Roster.findById(rosterId);

            if (!roster) {
                throw new Error("Roster entry not found");
            }

            // Hard delete - actually remove the record from the database
            await Roster.findByIdAndDelete(rosterId);

            return roster;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get roster entries for a specific staff member
     * Staff can view their own, admin can view any
     */
    async getStaffRoster(staffId, filters, currentUser) {
        try {
            // Staff can only view their own roster
            if (
                (currentUser.role === "receptionist" || currentUser.role === "housekeeping") &&
                staffId !== currentUser.id
            ) {
                throw new Error("You can only view your own roster");
            }

            const { from, to } = filters;

            let query = {
                staffId,
                isActive: true,
            };

            // Date range filtering (default to current week if not specified)
            if (from || to) {
                query.date = {};
                if (from) query.date.$gte = new Date(from);
                if (to) query.date.$lte = new Date(to);
            } else {
                // Default: show rosters from today onwards
                query.date = { $gte: new Date() };
            }

            const rosters = await Roster.find(query)
                .populate("hotelId", "name code city address")
                .sort({ date: 1, shiftStartTime: 1 });

            return rosters;
        } catch (error) {
            throw error;
        }
    }
}

export default new RosterService();
