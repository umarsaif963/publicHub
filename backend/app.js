import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";

import connectDB from "./config/db.js";
import commentRoutes from "./routes/comment.route.js";
import authRoutes from "./routes/auth.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import messageRoutes from "./routes/message.route.js";
import { initSocket } from "./sockets/index.js";

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

connectDB();

const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});