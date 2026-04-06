import { createStory, getStoriesForFeed, getStoryById, addViewer, deleteStory, getUserStoryCount } from '../repositories/story.repository.js';
import { getIO } from '../sockets/index.js';
import { getUser } from '../sockets/users.js';

const STORY_DURATION_MINUTES = 1;

export const createStoryService = async (userId, media, mediaType) => {
    const expiresAt = new Date(Date.now() + STORY_DURATION_MINUTES * 60 * 1000);
    
    const story = await createStory({
        user: userId,
        media,
        mediaType,
        expiresAt
    });

    const populatedStory = await getStoryById(story._id);
    
    const io = getIO();
    io.emit("newStory", populatedStory);

    return populatedStory;
};

export const getFeedStoriesService = async (userId, followingIds) => {
    const stories = await getStoriesForFeed(userId, followingIds);
    
    const storiesWithUser = stories.reduce((acc, story) => {
        const userId = story.user._id.toString();
        if (!acc[userId]) {
            acc[userId] = {
                user: story.user,
                stories: []
            };
        }
        acc[userId].stories.push(story);
        return acc;
    }, {});

    return Object.values(storiesWithUser);
};

export const viewStoryService = async (storyId, userId) => {
    const story = await addViewer(storyId, userId);
    
    const io = getIO();
    const socketId = getUser(story.user._id.toString());
    
    if (socketId) {
        io.to(socketId).emit("storyViewed", { storyId, viewerId: userId });
    }

    return story;
};

export const deleteStoryService = async (storyId, userId) => {
    return await deleteStory(storyId, userId);
};

export const getMyStoriesService = async (userId) => {
    const stories = await getStoriesForFeed(userId, []);
    const userStories = stories.filter(s => s.user._id.toString() === userId);
    
    if (userStories.length === 0) return [];
    
    return [{
        user: userStories[0].user,
        stories: userStories
    }];
};

export const getStoryCountService = async (userId) => {
    return await getUserStoryCount(userId);
};