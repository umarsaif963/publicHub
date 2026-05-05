import * as MessageService from "../services/message.service.js";
import MessageRequest from "../models/messageRequest.model.js";
import Message from "../models/message.model.js";
import { getIO } from "../sockets/index.js";

export const sendMessage = async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        const senderId = req.user?.toString();

        console.log("=== SEND MESSAGE DEBUG ===");
        console.log("senderId (req.user):", senderId);
        console.log("receiverId (req.body):", receiverId);
        console.log("Are they equal?:", senderId === receiverId?.toString());

        const message = await MessageService.sendMessage(senderId, receiverId, text);
        console.log("Saved message sender:", message.sender?.toString());
        console.log("Saved message receiver:", message.receiver?.toString());

        const io = getIO();
        io.to(receiverId.toString()).emit("newMessage", message);

        res.status(201).json(message);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getPendingRequests = async (req, res) => {
    try {
        const receiverId = req.user?.toString();

        const requests = await MessageRequest.find({
            receiver: receiverId,
            isAccepted: false
        }).populate("sender", "username profilePic");

        res.json(requests);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const respondToRequest = async (req, res) => {
    try {
        const { requestId, action } = req.body;
        const receiverId = req.user?.toString();

        const result = await MessageService.handleRequest(receiverId, requestId, action);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user?.toString();

        const messages = await MessageService.getMessages(currentUserId, userId);
        res.json(messages);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const currentUserId = req.user?.toString();

        const message = await MessageService.deleteMessage(messageId, currentUserId);
        res.json({ success: true, message });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const currentUserId = req.user?.toString();
        const { userId } = req.params;

        const seenCount = await MessageService.markAsRead(currentUserId, userId);

        if (seenCount > 0) {
            const io = getIO();
            io.to(userId.toString()).emit("messagesSeen", {
                by: currentUserId
            });
        }

        res.json({ success: true, seenCount });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getConversations = async (req, res) => {
    try {
        const currentUserId = req.user?.toString();
        const messages = await Message.find({
            $or: [
                { sender: currentUserId },
                { receiver: currentUserId }
            ]
        })
        .sort({ createdAt: -1 })
        .populate("sender", "username profilePic")
        .populate("receiver", "username profilePic");

        const conversationMap = new Map();

        messages.forEach(msg => {
            const sender = msg.sender;
            const receiver = msg.receiver;

            const otherUser = sender._id.toString() === currentUserId ? receiver : sender;
            const otherUserId = otherUser._id.toString();

            if (!conversationMap.has(otherUserId)) {
                conversationMap.set(otherUserId, {
                    otherUser: {
                        _id: otherUser._id,
                        username: otherUser.username,
                        profilePic: otherUser.profilePic
                    },
                    lastMessage: msg.text,
                    lastMessageTime: msg.createdAt,
                    unreadCount: 0
                });
            }
        });

        const unreadMessages = await Message.find({
            receiver: currentUserId,
            isRead: false
        });

        unreadMessages.forEach(msg => {
            const senderId = msg.sender.toString();
            if (conversationMap.has(senderId)) {
                conversationMap.get(senderId).unreadCount += 1;
            }
        });
        const conversations = Array.from(conversationMap.values());

        res.json(conversations);
    } catch (err) {
        console.error("getConversations error:", err);
        res.status(400).json({ error: err.message });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const currentUserId = req.user?.toString();

        const count = await Message.countDocuments({
            receiver: currentUserId,
            isRead: false
        });

        res.json({ count });
    } catch (err) {
        console.error("getUnreadCount error:", err);
        res.status(400).json({ error: err.message });
    }
};