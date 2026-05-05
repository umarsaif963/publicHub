import * as postService from "../services/post.service.js";
import User from "../models/auth.model.js";

export const createPost = async (req, res) => {
    try {
        const userId = req.user;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const data = {
            image: req.file ? req.file.filename : null,
            description: req.body.description,
            hashtag: req.body.hashtag
        };
        const followers = user.followers || [];
        const post = await postService.createPostService(userId, data, followers);
        res.status(201).json(post);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getPosts = async (req, res) => {
    try {
        const posts = await postService.getPostsService();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const editPost = async (req, res) => {
    try {
        const userId = req.user;
        const postId = req.params.postId;

        const data = {
            description: req.body.description,
            image: req.file ? req.file.filename : null
        };

        const post = await postService.editPostService(postId, userId, data);
        res.status(200).json(post);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deletePost = async (req, res) => {
    try {
        const userId = req.user;
        const postId = req.params.postId;

        const result = await postService.deletePostService(postId, userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const toggleLikePost = async (req, res) => {
    try {
        const userId = req.user;
        const postId = req.params.postId;

        const post = await postService.toggleLikePostService(postId, userId);
        res.status(200).json(post);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};