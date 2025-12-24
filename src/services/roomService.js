import Room from "../models/Room.js";

class RoomService {
    /**
     * Create a new room
     * @param {Object} roomData - Room data
     * @returns {Object} Created room
     */
    async createRoom(roomData) {
        const { roomNumber, roomType, pricePerNight, capacity, description, images, status } = roomData;

        // Validate required fields
        if (!roomNumber || !roomType || pricePerNight === undefined || !capacity) {
            throw new Error("Room number, room type, price per night, and capacity are required");
        }

        // Validate images
        if (!images || !Array.isArray(images)) {
            throw new Error("Images must be provided as an array");
        }

        if (images.length < 1) {
            throw new Error("At least one image URL is required");
        }

        if (images.length > 4) {
            throw new Error("Maximum of 4 image URLs allowed");
        }

        // Check if room number already exists
        const existingRoom = await Room.findOne({ roomNumber });

        if (existingRoom) {
            throw new Error(`Room with number ${roomNumber} already exists`);
        }

        // Create new room
        const newRoom = new Room({
            roomNumber,
            roomType,
            pricePerNight,
            capacity,
            description: description || "",
            images,
            status: status || "available",
        });

        await newRoom.save();

        return newRoom.toJSON();
    }

    /**
     * Get all rooms with optional filtering and pagination
     * @param {Object} filters - Optional filters (roomType, status, minPrice, maxPrice)
     * @param {Object} pagination - Pagination options (page, limit)
     * @returns {Object} Paginated rooms with metadata
     */
    async getAllRooms(filters = {}, pagination = {}) {
        const query = {};

        // Apply filters
        if (filters.roomType) {
            query.roomType = filters.roomType;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            query.pricePerNight = {};
            if (filters.minPrice !== undefined) {
                query.pricePerNight.$gte = Number(filters.minPrice);
            }
            if (filters.maxPrice !== undefined) {
                query.pricePerNight.$lte = Number(filters.maxPrice);
            }
        }

        // Pagination
        const page = parseInt(pagination.page) || 1;
        const limit = parseInt(pagination.limit) || 12;
        const skip = (page - 1) * limit;

        // Get total count for pagination metadata
        const totalRooms = await Room.countDocuments(query);

        // Get paginated rooms
        const rooms = await Room.find(query)
            .sort({ roomNumber: 1 })
            .skip(skip)
            .limit(limit);

        // Calculate total pages
        const totalPages = Math.ceil(totalRooms / limit);

        return {
            rooms: rooms.map((room) => room.toJSON()),
            pagination: {
                totalRooms,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }

    /**
     * Get a single room by ID
     * @param {string} roomId - Room ID
     * @returns {Object} Room object
     */
    async getRoomById(roomId) {
        const room = await Room.findById(roomId);

        if (!room) {
            throw new Error("Room not found");
        }

        return room.toJSON();
    }

    /**
     * Update a room
     * @param {string} roomId - Room ID
     * @param {Object} updateData - Data to update
     * @returns {Object} Updated room
     */
    async updateRoom(roomId, updateData) {
        // Check if room exists
        const existingRoom = await Room.findById(roomId);

        if (!existingRoom) {
            throw new Error("Room not found");
        }

        // If roomNumber is being updated, check for uniqueness
        if (updateData.roomNumber && updateData.roomNumber !== existingRoom.roomNumber) {
            const duplicateRoom = await Room.findOne({ roomNumber: updateData.roomNumber });

            if (duplicateRoom) {
                throw new Error(`Room with number ${updateData.roomNumber} already exists`);
            }
        }

        // Validate images if provided
        if (updateData.images) {
            if (!Array.isArray(updateData.images)) {
                throw new Error("Images must be provided as an array");
            }

            if (updateData.images.length < 1) {
                throw new Error("At least one image URL is required");
            }

            if (updateData.images.length > 4) {
                throw new Error("Maximum of 4 image URLs allowed");
            }
        }

        // Update room
        const allowedUpdates = [
            "roomNumber",
            "roomType",
            "pricePerNight",
            "capacity",
            "description",
            "images",
            "status",
        ];

        const updates = {};
        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                updates[key] = updateData[key];
            }
        }

        const updatedRoom = await Room.findByIdAndUpdate(roomId, updates, {
            new: true,
            runValidators: true,
        });

        return updatedRoom.toJSON();
    }

    /**
     * Delete a room
     * @param {string} roomId - Room ID
     * @returns {Object} Deleted room
     */
    async deleteRoom(roomId) {
        const room = await Room.findByIdAndDelete(roomId);

        if (!room) {
            throw new Error("Room not found");
        }

        return room.toJSON();
    }

    /**
     * Get room by room number
     * @param {string} roomNumber - Room number
     * @returns {Object} Room object
     */
    async getRoomByNumber(roomNumber) {
        const room = await Room.findOne({ roomNumber });

        if (!room) {
            throw new Error(`Room with number ${roomNumber} not found`);
        }

        return room.toJSON();
    }
}

export default new RoomService();

