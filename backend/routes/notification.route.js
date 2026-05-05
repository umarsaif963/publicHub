import express from "express";
import { getNotifications, markNotificationsAsRead } from "../controllers/notification.controller.js";
import {authMiddleware} from "../middleware/jwt.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.put("/read", authMiddleware, markNotificationsAsRead);

export default router;