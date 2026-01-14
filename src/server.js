import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import rosterScheduler from "./utils/rosterScheduler.js";

dotenv.config();

const PORT = process.env.PORT;

// Initialize database connection before starting the server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);

            // Start automated roster generation scheduler
            rosterScheduler.start();
        });
    } catch (error) {
        console.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
