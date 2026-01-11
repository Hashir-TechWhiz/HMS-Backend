import hotelService from "../../services/hotelService.js";

class HotelController {
    /**
     * Create a new hotel (Admin only)
     * POST /api/hotels
     */
    async createHotel(req, res, next) {
        try {
            const hotel = await hotelService.createHotel(req.body);

            res.status(201).json({
                success: true,
                message: "Hotel created successfully",
                data: hotel,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all hotels (Admin only)
     * GET /api/hotels
     * Query params: status, city, country, page, limit
     */
    async getAllHotels(req, res, next) {
        try {
            const filters = {
                status: req.query.status,
                city: req.query.city,
                country: req.query.country,
            };

            const pagination = {
                page: req.query.page,
                limit: req.query.limit,
            };

            const result = await hotelService.getAllHotels(filters, pagination);

            res.status(200).json({
                success: true,
                count: result.hotels.length,
                pagination: result.pagination,
                data: result.hotels,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get active hotels (for selection/dropdown)
     * GET /api/hotels/active
     */
    async getActiveHotels(req, res, next) {
        try {
            const hotels = await hotelService.getActiveHotels();

            res.status(200).json({
                success: true,
                count: hotels.length,
                data: hotels,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single hotel by ID (Admin only)
     * GET /api/hotels/:id
     */
    async getHotelById(req, res, next) {
        try {
            const hotel = await hotelService.getHotelById(req.params.id);

            res.status(200).json({
                success: true,
                data: hotel,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a hotel (Admin only)
     * PATCH /api/hotels/:id
     */
    async updateHotel(req, res, next) {
        try {
            const hotel = await hotelService.updateHotel(req.params.id, req.body);

            res.status(200).json({
                success: true,
                message: "Hotel updated successfully",
                data: hotel,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a hotel (Admin only)
     * DELETE /api/hotels/:id
     */
    async deleteHotel(req, res, next) {
        try {
            const hotel = await hotelService.deleteHotel(req.params.id);

            res.status(200).json({
                success: true,
                message: "Hotel deleted successfully",
                data: hotel,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new HotelController();
