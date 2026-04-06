import upload from '../utils/multerConfig.js';
import { 
    createStoryService, 
    getFeedStoriesService, 
    viewStoryService, 
    deleteStoryService,
    getMyStoriesService,
    getStoryCountService
} from '../services/story.service.js';
import User from '../models/auth.model.js';

export const createStory = async (req, res) => {
    try {
        const userId = req.user;
        const file = req.file;
        const mediaType = req.body.mediaType || 'image';

        if (!file) {
            return res.status(400).json({ error: "Media file is required" });
        }

        const story = await createStoryService(userId, file.filename, mediaType);
        res.status(201).json(story);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getFeedStories = async (req, res) => {
    try {
        const userId = req.user;
        const user = await User.findById(userId);
        const followingIds = user.following || [];
        
        const stories = await getFeedStoriesService(userId, followingIds);
        res.json(stories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const viewStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user;
        
        await viewStoryService(storyId, userId);
        res.json({ message: "Story viewed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user;
        
        const result = await deleteStoryService(storyId, userId);
        res.json(result);
    } catch (error) {
        if (error.message === "Unauthorized") {
            return res.status(403).json({ error: error.message });
        }
        if (error.message === "Story not found") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const getMyStories = async (req, res) => {
    try {
        const userId = req.user;
        const stories = await getMyStoriesService(userId);
        res.json(stories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStoryCount = async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await getStoryCountService(userId);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { upload };