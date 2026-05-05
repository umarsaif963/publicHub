import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { addUser, removeUser } from "./users.js";

let io;

export const initSocket = (server) => {
    if (io) return io;

    io = new Server(server, {
        cors: { origin: "http://localhost:5173" },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error: Token missing"));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error("Authentication error: Invalid token"));

            socket.userId = decoded.id?.toString();
            next();
        });
    });

    io.on("connection", (socket) => {
        const userId = socket.userId;
        console.log("Authenticated User Connected:", userId);

        addUser(userId, socket.id);
        socket.join(userId);

        // FEATURE: Join unique chat room
        socket.on("join_room", (roomId) => {
            socket.join(roomId);
            console.log(`User ${userId} joined room: ${roomId}`);
        });

        // FEATURE: Send real-time message via socket
        socket.on("send_message", (data) => {
            console.log("DEBUG: Socket message received ->", data);
            // data should have roomId, senderId, text, etc.
            io.to(data.roomId).emit("receive_message", data);
        });

        socket.on("disconnect", () => {
            removeUser(socket.id);
            console.log("User Disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error("Socket not initialized");
    return io;
};