import Story from '../models/story.model.js';
import User from '../models/auth.model.js';

export const createStory = async (storyData) => {
    return await Story.create(storyData);
};

export const getStoriesByUser = async (userId) => {
    const now = new Date();
    return await Story.find({ user: userId, expiresAt: { $gt: now } })
        .populate('user', 'username profilePic')
        .sort({ createdAt: -1 });
};

export const getStoriesForFeed = async (userId, followingIds) => {
    const now = new Date();
    const userIds = [userId, ...followingIds];
    return await Story.find({ user: { $in: userIds }, expiresAt: { $gt: now } })
        .populate('user', 'username profilePic')
        .sort({ createdAt: -1 });
};

export const getStoryById = async (storyId) => {
    return await Story.findById(storyId).populate('user', 'username profilePic');
};

export const addViewer = async (storyId, userId) => {
    return await Story.findByIdAndUpdate(
        storyId,
        { $addToSet: { viewers: userId } },
        { new: true }
    );
};

export const deleteStory = async (storyId, userId) => {
    const story = await Story.findById(storyId);
    if (!story) throw new Error("Story not found");
    if (story.user.toString() !== userId) throw new Error("Unauthorized");
    await story.deleteOne();
    return { message: "Story deleted" };
};

export const getUserStoryCount = async (userId) => {
    const now = new Date();
    return await Story.countDocuments({ user: userId, expiresAt: { $gt: now } });
};