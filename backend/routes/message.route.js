import express from "express";
import { 
    sendMessage, 
    getMessages, 
    deleteMessage, 
    getPendingRequests, 
    respondToRequest,
    markAsRead,
    getConversations,
    getUnreadCount
} from "../controllers/message.controller.js";
import { authMiddleware } from "../middleware/jwt.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, sendMessage);

router.get("/conversations", authMiddleware, getConversations);

router.get("/unread-count", authMiddleware, getUnreadCount);

router.get("/conversation/:userId", authMiddleware, getMessages);

router.delete("/:messageId", authMiddleware, deleteMessage);

router.put("/read/:userId", authMiddleware, markAsRead);

router.get("/requests/pending", authMiddleware, getPendingRequests);

router.post("/requests/respond", authMiddleware, respondToRequest);

export default router;