import { getNotificationsByUser, markAsReadRepo } from "../repositories/notification.repository.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user; 

        const notifications = await getNotificationsByUser(userId);

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const markNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user;
        await markAsReadRepo(userId);
        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};