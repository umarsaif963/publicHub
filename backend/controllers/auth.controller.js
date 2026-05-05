import { signupService, loginService, logoutService } from '../services/auth.service.js';
import User from '../models/auth.model.js';
import Post from '../models/post.model.js';
import { getIO } from "../sockets/index.js";
import { getUser } from "../sockets/users.js";

export const userSignup = async (req, res) => {
    try {
        await signupService(req.body);
        res.status(201).json({ message: 'Signup Successfully' });
    } catch (error) {
        if (error.message === 'EMAIL_EXISTS') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        if (error.message === 'PASSWORD_NOT_MATCH') {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        res.status(500).json({ error: error.message });
    }
};

export const userLogin = async (req, res) => {
    try {
        const data = await loginService(req.body);
        res.status(200).json({
            message: "Login Successfully",
            ...data
        });
    } catch (error) {
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({ message: 'User not found' });
        }
        if (error.message === 'INVALID_PASSWORD') {
            return res.status(400).json({ message: 'Incorrect password' });
        }
        res.status(500).json({ error: error.message });
    }
};

export const userLogout = async (req, res) => {
    try {
        const result = await logoutService();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        const users = await User.find({
            username: { $regex: q, $options: "i" },
            _id: { $ne: req.user } // plain string
        }).select("username isPrivate profilePic");

        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select("-password -email");
        if (!user) return res.status(404).json({ error: "User not found" });

        const postCount = await Post.countDocuments({ user: userId });

        res.json({
            _id: user._id,
            username: user.username,
            profilePic: user.profilePic,
            isPrivate: user.isPrivate,
            followers: user.followers || [],
            following: user.following || [],
            followersCount: Array.isArray(user.followers) ? user.followers.length : 0,
            followingCount: Array.isArray(user.following) ? user.following.length : 0,
            postCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.user; // plain string
        const { username } = req.body;

        const updateData = {};
        if (username) updateData.username = username;
        if (req.file) updateData.profilePic = req.file.filename;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select("-password");

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;

        const posts = await Post.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate("user", "username profilePic");

        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const toggleFollow = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user;

        if (targetUserId === currentUserId) {
            return res.status(400).json({ error: "You cannot follow yourself" });
        }

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser || !currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const isFollowing = currentUser.following.includes(targetUserId);

        if (isFollowing) {
            currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
        } else {
            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);
        }

        await currentUser.save();
        await targetUser.save();

        // Real-time Update
        const io = getIO();
        const targetSocketId = getUser(targetUserId);
        const currentSocketId = getUser(currentUserId);
        
        if (targetSocketId) {
            io.to(targetSocketId).emit("notification", {
                type: isFollowing ? "unfollow" : "follow",
                sender: currentUserId,
                message: isFollowing ? "stopped following you" : "started following you"
            });
        }

        // Notify sender's other tabs
        if (currentSocketId) {
            io.to(currentUserId).emit("followUpdate", {
                targetId: targetUserId,
                isFollowing: !isFollowing
            });
        }

        res.status(200).json({ 
            message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
            isFollowing: !isFollowing 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};