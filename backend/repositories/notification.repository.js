import Notification from "../models/notification.model.js";

export const createNotification = (data) =>
    Notification.create(data);

export const getNotificationsByUser = (userId) =>
    Notification.find({ receiver: userId })
        .populate("sender", "username profilePic")
        .populate("post")
        .sort({ createdAt: -1 });

export const markAsReadRepo = (userId) =>
    Notification.updateMany({ receiver: userId, isRead: false }, { isRead: true });