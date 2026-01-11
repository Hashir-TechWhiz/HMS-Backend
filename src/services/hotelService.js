import Hotel from "../models/Hotel.js";

class HotelService {
    /**
     * Create a new hotel (Admin only)
     * @param {Object} hotelData - Hotel data
     * @returns {Object} Created hotel
     */
    async createHotel(hotelData) {
        const { name, code, address, city, country, contactEmail, contactPhone, status } = hotelData;

        // Validate required fields
        if (!name || !code || !address || !city || !country || !contactEmail || !contactPhone) {
            throw new Error("All hotel fields are required");
        }

        // Validate code format
        const codePattern = /^HMS-\d{3}$/;
        if (!codePattern.test(code)) {
            throw new Error("Hotel code must follow format HMS-XXX (e.g., HMS-001)");
        }

        // Check if hotel code already exists
        const existingHotel = await Hotel.findOne({ code: code.toUpperCase() });

        if (existingHotel) {
            throw new Error(`Hotel with code ${code} already exists`);
        }

        // Create new hotel
        const newHotel = new Hotel({
            name,
            code: code.toUpperCase(),
            address,
            city,
            country,
            contactEmail,
            contactPhone,
            status: status || "Active",
        });

        await newHotel.save();

        return newHotel.toJSON();
    }

    /**
     * Get all hotels with optional filtering and pagination
     * @param {Object} filters - Optional filters (status, city, country)
     * @param {Object} pagination - Pagination options (page, limit)
     * @returns {Object} Paginated hotels with metadata
     */
    async getAllHotels(filters = {}, pagination = {}) {
        const query = {};

        // Apply filters
        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.city) {
            query.city = { $regex: filters.city, $options: "i" };
        }

        if (filters.country) {
            query.country = { $regex: filters.country, $options: "i" };
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination metadata
        const totalHotels = await Hotel.countDocuments(query);

        // Get paginated hotels
        const hotels = await Hotel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate total pages
        const totalPages = Math.ceil(totalHotels / limit);

        return {
            hotels: hotels.map((hotel) => hotel.toJSON()),
            pagination: {
                totalHotels,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }

    /**
     * Get a single hotel by ID
     * @param {string} hotelId - Hotel ID
     * @returns {Object} Hotel object
     */
    async getHotelById(hotelId) {
        const hotel = await Hotel.findById(hotelId);

        if (!hotel) {
            throw new Error("Hotel not found");
        }

        return hotel.toJSON();
    }

    /**
     * Get a hotel by code
     * @param {string} code - Hotel code
     * @returns {Object} Hotel object
     */
    async getHotelByCode(code) {
        const hotel = await Hotel.findOne({ code: code.toUpperCase() });

        if (!hotel) {
            throw new Error(`Hotel with code ${code} not found`);
        }

        return hotel.toJSON();
    }

    /**
     * Update a hotel (Admin only)
     * @param {string} hotelId - Hotel ID
     * @param {Object} updateData - Data to update
     * @returns {Object} Updated hotel
     */
    async updateHotel(hotelId, updateData) {
        // Check if hotel exists
        const existingHotel = await Hotel.findById(hotelId);

        if (!existingHotel) {
            throw new Error("Hotel not found");
        }

        // If code is being updated, check for uniqueness
        if (updateData.code && updateData.code.toUpperCase() !== existingHotel.code) {
            // Validate code format
            const codePattern = /^HMS-\d{3}$/;
            if (!codePattern.test(updateData.code)) {
                throw new Error("Hotel code must follow format HMS-XXX (e.g., HMS-001)");
            }

            const duplicateHotel = await Hotel.findOne({ code: updateData.code.toUpperCase() });

            if (duplicateHotel) {
                throw new Error(`Hotel with code ${updateData.code} already exists`);
            }
        }

        // Update hotel
        const allowedUpdates = [
            "name",
            "code",
            "address",
            "city",
            "country",
            "contactEmail",
            "contactPhone",
            "status",
        ];

        const updates = {};
        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                updates[key] = key === "code" ? updateData[key].toUpperCase() : updateData[key];
            }
        }

        const updatedHotel = await Hotel.findByIdAndUpdate(hotelId, updates, {
            new: true,
            runValidators: true,
        });

        return updatedHotel.toJSON();
    }

    /**
     * Delete a hotel (Admin only)
     * @param {string} hotelId - Hotel ID
     * @returns {Object} Deleted hotel
     */
    async deleteHotel(hotelId) {
        const hotel = await Hotel.findByIdAndDelete(hotelId);

        if (!hotel) {
            throw new Error("Hotel not found");
        }

        return hotel.toJSON();
    }

    /**
     * Get all active hotels (for dropdown/selection)
     * @returns {Array} Array of active hotels
     */
    async getActiveHotels() {
        const hotels = await Hotel.find({ status: "Active" })
            .sort({ name: 1 })
            .select("_id name code city");

        return hotels.map((hotel) => hotel.toJSON());
    }
}

export default new HotelService();
