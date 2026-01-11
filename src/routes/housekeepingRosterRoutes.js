import express from "express";
import housekeepingRosterController from "../controllers/housekeeping/housekeepingRosterController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/**
 * @route   POST /api/housekeeping/generate
 * @desc    Generate daily housekeeping tasks
 */
router.post(
    "/generate",
    authenticate,
    authorize("admin"),
    housekeepingRosterController.generateDailyTasks
);

/**
 * @route   GET /api/housekeeping/tasks
 * @desc    Get housekeeping tasks for a date
 */
router.get(
    "/tasks",
    authenticate,
    authorize("admin", "receptionist", "housekeeping"),
    housekeepingRosterController.getTasksByDate
);

/**
 * @route   GET /api/housekeeping/my-tasks
 * @desc    Get my tasks (housekeeping role)
 */
router.get(
    "/my-tasks",
    authenticate,
    authorize("housekeeping"),
    housekeepingRosterController.getMyTasks
);

/**
 * @route   PATCH /api/housekeeping/tasks/:id/status
 * @desc    Update task status
 */
router.patch(
    "/tasks/:id/status",
    authenticate,
    authorize("admin", "receptionist", "housekeeping"),
    housekeepingRosterController.updateTaskStatus
);

/**
 * @route   PATCH /api/housekeeping/tasks/:id/assign
 * @desc    Assign task
 */
router.patch(
    "/tasks/:id/assign",
    authenticate,
    authorize("admin"),
    housekeepingRosterController.assignTask
);

export default router;
