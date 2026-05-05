import express from "express";
import {
    createPost,
    editPost,
    deletePost,
    toggleLikePost,
    getPosts
} from "../controllers/post.controller.js";

import { authMiddleware } from "../middleware/jwt.middleware.js";
import upload from "../utils/multerConfig.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    upload.single("image"),
    createPost
);

router.get(
    "/", 
    getPosts);

router.put(
    "/edit/:postId",
    authMiddleware,
    upload.single("image"),
    editPost
);

router.delete(
    "/delete/:postId",
    authMiddleware,
    deletePost
);

router.put(
    "/like/:postId",
    authMiddleware,
    toggleLikePost
);

export default router;