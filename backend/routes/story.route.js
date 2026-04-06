import express from 'express';
import { 
    createStory, 
    getFeedStories, 
    viewStory, 
    deleteStory, 
    getMyStories,
    getStoryCount,
    upload 
} from '../controllers/story.controller.js';
import { authMiddleware } from '../middleware/jwt.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, upload.single('media'), createStory);
router.get('/feed', authMiddleware, getFeedStories);
router.get('/my-stories', authMiddleware, getMyStories);
router.get('/count/:userId', authMiddleware, getStoryCount);
router.post('/:storyId/view', authMiddleware, viewStory);
router.delete('/:storyId', authMiddleware, deleteStory);

export default router;