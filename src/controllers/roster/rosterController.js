import rosterService from "../../services/rosterService.js";

class RosterController {
    /**
     * Create a new roster entry
     * POST /api/rosters
     * Admin only
     */
    async createRoster(req, res, next) {
        try {
            const currentUser = req.user;

            const roster = await rosterService.createRoster(req.body, currentUser);

            res.status(201).json({
                success: true,
                message: "Roster entry created successfully",
                data: roster,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all roster entries with filters
     * GET /api/rosters
     * Admin: can view all rosters
     * Staff: can only view their own rosters
     */
    async getAllRosters(req, res, next) {
        try {
            const currentUser = req.user;

            const filters = {
                hotelId: req.query.hotelId,
                staffId: req.query.staffId,
                date: req.query.date,
                shiftType: req.query.shiftType,
                role: req.query.role,
                from: req.query.from,
                to: req.query.to,
            };

            const pagination = {
                page: req.query.page,
                limit: req.query.limit,
            };

            const result = await rosterService.getAllRosters(filters, pagination, currentUser);

            res.status(200).json({
                success: true,
                count: result.rosters.length,
                pagination: result.pagination,
                data: result.rosters,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get roster by ID
     * GET /api/rosters/:id
     * Admin: can view any roster
     * Staff: can only view their own roster
     */
    async getRosterById(req, res, next) {
        try {
            const currentUser = req.user;

            const roster = await rosterService.getRosterById(req.params.id, currentUser);

            res.status(200).json({
                success: true,
                data: roster,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update roster entry
     * PATCH /api/rosters/:id
     * Admin only
     */
    async updateRoster(req, res, next) {
        try {
            const currentUser = req.user;

            const roster = await rosterService.updateRoster(req.params.id, req.body, currentUser);

            res.status(200).json({
                success: true,
                message: "Roster entry updated successfully",
                data: roster,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete roster entry
     * DELETE /api/rosters/:id
     * Admin only
     */
    async deleteRoster(req, res, next) {
        try {
            const currentUser = req.user;

            const roster = await rosterService.deleteRoster(req.params.id, currentUser);

            res.status(200).json({
                success: true,
                message: "Roster entry deleted successfully",
                data: roster,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get roster entries for a specific staff member
     * GET /api/rosters/staff/:staffId
     * Staff can view their own, admin can view any
     */
    async getStaffRoster(req, res, next) {
        try {
            const currentUser = req.user;
            const staffId = req.params.staffId;

            const filters = {
                from: req.query.from,
                to: req.query.to,
            };

            const rosters = await rosterService.getStaffRoster(staffId, filters, currentUser);

            res.status(200).json({
                success: true,
                count: rosters.length,
                data: rosters,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get my roster (convenience endpoint for current user)
     * GET /api/rosters/my-roster
     * Staff only
     */
    async getMyRoster(req, res, next) {
        try {
            const currentUser = req.user;

            const filters = {
                from: req.query.from,
                to: req.query.to,
            };

            const rosters = await rosterService.getStaffRoster(currentUser.id, filters, currentUser);

            res.status(200).json({
                success: true,
                count: rosters.length,
                data: rosters,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new RosterController();
