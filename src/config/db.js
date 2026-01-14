import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const isTestEnv = process.env.NODE_ENV === "test";

        const mongoURI = isTestEnv
            ? process.env.MONGO_URI_TEST
            : process.env.MONGO_URI_TEST2;

        if (!mongoURI) {
            throw new Error(
                isTestEnv
                    ? "MONGO_URI_TEST environment variable is not defined"
                    : "MONGO_URI environment variable is not defined"
            );
        }

        await mongoose.connect(mongoURI);

        console.log(
            `✅ MongoDB Connected Successfully (${isTestEnv ? "TEST" : "MAIN"} DB)`
        );
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
