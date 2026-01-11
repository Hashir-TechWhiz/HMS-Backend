import housekeepingRosterService from "../../services/housekeepingRosterService.js";

class HousekeepingRosterController {
    /**
     * Generate daily housekeeping tasks
     * POST /api/housekeeping/generate
     */
    async generateDailyTasks(req, res, next) {
        try {
            const { hotelId, date } = req.body;
            const currentUser = req.user;

            const result = await housekeepingRosterService.generateDailyTasks(hotelId, date, currentUser);

            res.status(201).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get housekeeping tasks for a date
     * GET /api/housekeeping/tasks
     */
    async getTasksByDate(req, res, next) {
        try {
            const { hotelId, date, shift, status, assignedTo } = req.query;
            const currentUser = req.user;
            const taskDate = date || new Date();

            const filters = { shift, status, assignedTo };
            const tasks = await housekeepingRosterService.getTasksByDate(hotelId, taskDate, filters, currentUser);

            res.status(200).json({
                success: true,
                count: tasks.length,
                data: tasks,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get my tasks (housekeeping role)
     * GET /api/housekeeping/my-tasks
     */
    async getMyTasks(req, res, next) {
        try {
            const { date, shift, status } = req.query;
            const currentUser = req.user;

            const filters = { date, shift, status };
            const tasks = await housekeepingRosterService.getMyTasks(currentUser, filters);

            res.status(200).json({
                success: true,
                count: tasks.length,
                data: tasks,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update task status
     * PATCH /api/housekeeping/tasks/:id/status
     */
    async updateTaskStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            const currentUser = req.user;

            const task = await housekeepingRosterService.updateTaskStatus(id, status, notes, currentUser);

            res.status(200).json({
                success: true,
                message: "Task status updated successfully",
                data: task,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Assign task
     * PATCH /api/housekeeping/tasks/:id/assign
     */
    async assignTask(req, res, next) {
        try {
            const { id } = req.params;
            const { staffId } = req.body;
            const currentUser = req.user;

            const task = await housekeepingRosterService.assignTask(id, staffId, currentUser);

            res.status(200).json({
                success: true,
                message: "Task assigned successfully",
                data: task,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new HousekeepingRosterController();
