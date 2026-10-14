import { Router } from 'express';
import { createJobAnalysis, listJobAnalyses } from '../controllers/jobAnalysisController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createJobAnalysis);
router.get('/', requireAuth, listJobAnalyses);

export default router;
