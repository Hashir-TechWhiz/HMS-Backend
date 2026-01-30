import publicFacilityService from "../../services/publicFacilityService.js";

class PublicFacilityController {
    /**
     * Create a new public facility
     * POST /api/public-facilities
     * Admin only
     */
    async createFacility(req, res, next) {
        try {
            const currentUser = req.user;
            const facility = await publicFacilityService.createFacility(req.body, currentUser);

            res.status(201).json({
                success: true,
                message: "Facility created successfully",
                data: facility,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all facilities
     * GET /api/public-facilities
     * Public access
     */
    async getAllFacilities(req, res, next) {
        try {
            const currentUser = req.user || {}; // May be undefined for public access

            const filters = {
                hotelId: req.query.hotelId,
                facilityType: req.query.facilityType,
                status: req.query.status,
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
            };

            const pagination = {
                page: req.query.page,
                limit: req.query.limit,
            };

            const result = await publicFacilityService.getAllFacilities(filters, pagination, currentUser);

            res.status(200).json({
                success: true,
                count: result.facilities.length,
                pagination: result.pagination,
                data: result.facilities,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single facility by ID
     * GET /api/public-facilities/:id
     * Public access
     */
    async getFacilityById(req, res, next) {
        try {
            const currentUser = req.user || {};
            const facility = await publicFacilityService.getFacilityById(req.params.id, currentUser);

            res.status(200).json({
                success: true,
                data: facility,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get facilities by hotel ID
     * GET /api/public-facilities/hotel/:hotelId
     * Public access
     */
    async getFacilitiesByHotel(req, res, next) {
        try {
            const facilities = await publicFacilityService.getFacilitiesByHotel(req.params.hotelId);

            res.status(200).json({
                success: true,
                count: facilities.length,
                data: facilities,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a facility
     * PATCH /api/public-facilities/:id
     * Admin only
     */
    async updateFacility(req, res, next) {
        try {
            const currentUser = req.user;
            const facility = await publicFacilityService.updateFacility(req.params.id, req.body, currentUser);

            res.status(200).json({
                success: true,
                message: "Facility updated successfully",
                data: facility,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a facility
     * DELETE /api/public-facilities/:id
     * Admin only
     */
    async deleteFacility(req, res, next) {
        try {
            const currentUser = req.user;
            await publicFacilityService.deleteFacility(req.params.id, currentUser);

            res.status(200).json({
                success: true,
                message: "Facility deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new PublicFacilityController();
