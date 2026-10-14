import { Router } from 'express';
import { createRoadmap, listRoadmaps, toggleMilestone } from '../controllers/roadmapController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, listRoadmaps);
router.post('/generate', requireAuth, createRoadmap);
router.patch('/:id/milestones/:milestoneIndex', requireAuth, toggleMilestone);

export default router;
