import PublicFacility from "../models/PublicFacility.js";
import mongoose from "mongoose";

class PublicFacilityService {
    /**
     * Create a new public facility
     * @param {Object} facilityData - Facility data
     * @param {Object} currentUser - Current user creating the facility
     * @returns {Object} Created facility
     */
    async createFacility(facilityData, currentUser) {
        try {
            // Check if facility name already exists for this hotel
            const existingFacility = await PublicFacility.findOne({
                hotelId: facilityData.hotelId,
                name: facilityData.name,
            });

            if (existingFacility) {
                throw new Error("A facility with this name already exists in this hotel");
            }

            const facility = await PublicFacility.create(facilityData);

            // Populate hotel details
            await facility.populate("hotelId", "name code city");

            return facility;
        } catch (error) {
            throw new Error(`Failed to create facility: ${error.message}`);
        }
    }

    /**
     * Get all facilities with optional filters
     * @param {Object} filters - Filter criteria
     * @param {Object} pagination - Pagination options
     * @param {Object} currentUser - Current user
     * @returns {Object} Facilities and pagination info
     */
    async getAllFacilities(filters = {}, pagination = {}, currentUser) {
        try {
            const query = {};

            // Apply hotel filter if user has hotelId
            if (currentUser.hotelId) {
                query.hotelId = currentUser.hotelId;
            } else if (filters.hotelId) {
                // Allow filtering by hotelId for super admin
                query.hotelId = filters.hotelId;
            }

            // Apply other filters
            if (filters.facilityType) {
                query.facilityType = filters.facilityType;
            }

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
                query.pricePerHour = {};
                if (filters.minPrice !== undefined) {
                    query.pricePerHour.$gte = parseFloat(filters.minPrice);
                }
                if (filters.maxPrice !== undefined) {
                    query.pricePerHour.$lte = parseFloat(filters.maxPrice);
                }
            }

            // Pagination
            const page = parseInt(pagination.page) || 1;
            const limit = parseInt(pagination.limit) || 10;
            const skip = (page - 1) * limit;

            const facilities = await PublicFacility.find(query)
                .populate("hotelId", "name code city")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await PublicFacility.countDocuments(query);

            return {
                facilities,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            throw new Error(`Failed to get facilities: ${error.message}`);
        }
    }

    /**
     * Get a single facility by ID
     * @param {string} facilityId - Facility ID
     * @param {Object} currentUser - Current user
     * @returns {Object} Facility
     */
    async getFacilityById(facilityId, currentUser) {
        try {
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(facilityId)) {
                throw new Error("Invalid facility ID");
            }

            const facility = await PublicFacility.findById(facilityId).populate("hotelId", "name code city");

            if (!facility) {
                throw new Error("Facility not found");
            }

            // Check if user has access to this facility's hotel
            if (currentUser.hotelId && facility.hotelId._id.toString() !== currentUser.hotelId.toString()) {
                throw new Error("You do not have access to this facility");
            }

            return facility;
        } catch (error) {
            throw new Error(`Failed to get facility: ${error.message}`);
        }
    }

    /**
     * Update a facility
     * @param {string} facilityId - Facility ID
     * @param {Object} updateData - Update data
     * @param {Object} currentUser - Current user
     * @returns {Object} Updated facility
     */
    async updateFacility(facilityId, updateData, currentUser) {
        try {
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(facilityId)) {
                throw new Error("Invalid facility ID");
            }

            const facility = await PublicFacility.findById(facilityId);

            if (!facility) {
                throw new Error("Facility not found");
            }

            // Check if user has access to this facility's hotel
            if (currentUser.hotelId && facility.hotelId.toString() !== currentUser.hotelId.toString()) {
                throw new Error("You do not have access to this facility");
            }

            // Check if name is being changed and if it already exists
            if (updateData.name && updateData.name !== facility.name) {
                const existingFacility = await PublicFacility.findOne({
                    hotelId: facility.hotelId,
                    name: updateData.name,
                    _id: { $ne: facilityId },
                });

                if (existingFacility) {
                    throw new Error("A facility with this name already exists in this hotel");
                }
            }

            // Prevent changing hotelId
            delete updateData.hotelId;

            // Update facility
            Object.assign(facility, updateData);
            await facility.save();

            // Populate hotel details
            await facility.populate("hotelId", "name code city");

            return facility;
        } catch (error) {
            throw new Error(`Failed to update facility: ${error.message}`);
        }
    }

    /**
     * Delete a facility
     * @param {string} facilityId - Facility ID
     * @param {Object} currentUser - Current user
     * @returns {Object} Success message
     */
    async deleteFacility(facilityId, currentUser) {
        try {
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(facilityId)) {
                throw new Error("Invalid facility ID");
            }

            const facility = await PublicFacility.findById(facilityId);

            if (!facility) {
                throw new Error("Facility not found");
            }

            // Check if user has access to this facility's hotel
            if (currentUser.hotelId && facility.hotelId.toString() !== currentUser.hotelId.toString()) {
                throw new Error("You do not have access to this facility");
            }

            // Check if there are any active bookings for this facility
            const PublicFacilityBooking = mongoose.model("PublicFacilityBooking");
            const activeBookings = await PublicFacilityBooking.countDocuments({
                facility: facilityId,
                status: { $nin: ["cancelled", "completed"] },
            });

            if (activeBookings > 0) {
                throw new Error("Cannot delete facility with active bookings");
            }

            await PublicFacility.findByIdAndDelete(facilityId);

            return { message: "Facility deleted successfully" };
        } catch (error) {
            throw new Error(`Failed to delete facility: ${error.message}`);
        }
    }

    /**
     * Get facilities by hotel ID
     * @param {string} hotelId - Hotel ID
     * @returns {Array} Facilities
     */
    async getFacilitiesByHotel(hotelId) {
        try {
            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(hotelId)) {
                throw new Error("Invalid hotel ID");
            }

            const facilities = await PublicFacility.find({
                hotelId,
                status: "available",
            }).sort({ name: 1 });

            return facilities;
        } catch (error) {
            throw new Error(`Failed to get facilities by hotel: ${error.message}`);
        }
    }
}

export default new PublicFacilityService();
