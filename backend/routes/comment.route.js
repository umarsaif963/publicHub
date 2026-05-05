import express from "express";
import {
    createComment,
    getComments,
    deleteComment,
    replyToComment,
    likeComment,
    editComment,
    editReply,
    deleteReply,
    likeReply
} from "../controllers/comment.controller.js";

import {authMiddleware} from "../middleware/jwt.middleware.js";

const router = express.Router();

router.post("/:postId", authMiddleware, createComment);
router.get("/:postId", getComments);

router.delete("/:id", authMiddleware, deleteComment);
router.put("/:id", authMiddleware, editComment);

router.post("/:id/reply", authMiddleware, replyToComment);
router.put("/:commentId/reply/:replyId", authMiddleware, editReply);
router.delete("/:commentId/reply/:replyId", authMiddleware, deleteReply);

router.post("/:id/like", authMiddleware, likeComment);
router.post("/:commentId/reply/:replyId/like", authMiddleware, likeReply);

export default router;