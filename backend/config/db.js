import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DataBase Connected");
    } catch (error) {
        console.error("MongoDB connection is failed:", error);
        process.exit(1);
    }
}

export default connectDB;
