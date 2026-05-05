import express from 'express';
import {
    userSignup,
    userLogin,
    userLogout,
    searchUsers,
    getProfile,
    editProfile,
    getUserPosts,
    toggleFollow
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/jwt.middleware.js';
import upload from '../utils/multerConfig.js';

const router = express.Router();

router.post('/signup', userSignup);
router.post('/login', userLogin);
router.post('/logout', userLogout);

router.get("/search", authMiddleware, searchUsers);

router.get("/profile/:userId", authMiddleware, getProfile);
router.put("/edit", authMiddleware, upload.single("profilePic"), editProfile);
router.get("/posts/:userId", authMiddleware, getUserPosts);

router.post("/follow/:id", authMiddleware, toggleFollow);

export default router;