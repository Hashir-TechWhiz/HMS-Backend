import roomService from "../../services/roomService.js";

class RoomController {
    /**
     * Create a new room (Admin only)
     * POST /api/rooms
     */
    async createRoom(req, res, next) {
        try {
            // Include hotelId from request (injected by middleware or provided by admin)
            const roomData = {
                ...req.body,
                hotelId: req.body.hotelId || req.hotelId
            };

            const room = await roomService.createRoom(roomData);

            res.status(201).json({
                success: true,
                message: "Room created successfully",
                data: room,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all rooms (Public)
     * GET /api/rooms
     * Query params: roomType, status, minPrice, maxPrice, page, limit
     */
    async getAllRooms(req, res, next) {
        try {
            const filters = {
                hotelId: req.query.hotelId || req.hotelId, // From middleware or query
                roomType: req.query.roomType,
                status: req.query.status,
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
            };

            const pagination = {
                page: req.query.page,
                limit: req.query.limit,
            };

            const result = await roomService.getAllRooms(filters, pagination);

            res.status(200).json({
                success: true,
                count: result.rooms.length,
                pagination: result.pagination,
                data: result.rooms,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single room by ID (Public)
     * GET /api/rooms/:id
     */
    async getRoomById(req, res, next) {
        try {
            const room = await roomService.getRoomById(req.params.id);

            res.status(200).json({
                success: true,
                data: room,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a room (Admin only)
     * PATCH /api/rooms/:id
     */
    async updateRoom(req, res, next) {
        try {
            const room = await roomService.updateRoom(req.params.id, req.body);

            res.status(200).json({
                success: true,
                message: "Room updated successfully",
                data: room,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a room (Admin only)
     * DELETE /api/rooms/:id
     */
    async deleteRoom(req, res, next) {
        try {
            const room = await roomService.deleteRoom(req.params.id);

            res.status(200).json({
                success: true,
                message: "Room deleted successfully",
                data: room,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new RoomController();

