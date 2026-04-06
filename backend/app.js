import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import cron from "node-cron";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import connectDB from "./config/db.js";
import commentRoutes from "./routes/comment.route.js";
import authRoutes from "./routes/auth.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import messageRoutes from "./routes/message.route.js";
import storyRoutes from "./routes/story.route.js";
import { initSocket } from "./sockets/index.js";
import Story from "./models/story.model.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("public/images/uploads"));

app.use("/user", authRoutes);
app.use("/comment", commentRoutes);
app.use("/post", postRoutes);
app.use("/notification", notificationRoutes);
app.use("/messages", messageRoutes);
app.use("/story", storyRoutes);

connectDB();

const server = http.createServer(app);

initSocket(server);

// Auto-delete expired stories every minute
cron.schedule("* * * * *", async () => {
    try {
        const expiredStories = await Story.find({ expiresAt: { $lt: new Date() } });
        
        for (const story of expiredStories) {
            // Delete media file
            const filePath = join(__dirname, "..", "public", "images", "uploads", story.media);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            // Delete story from DB
            await story.deleteOne();
        }
        
        if (expiredStories.length > 0) {
            console.log(`Deleted ${expiredStories.length} expired stories`);
        }
    } catch (err) {
        console.error("Error cleaning up stories:", err);
    }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});