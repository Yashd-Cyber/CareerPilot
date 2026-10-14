import { Router } from 'express';
import { createAssessment, getAssessmentQuestions, listAssessments } from '../controllers/assessmentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/questions', requireAuth, getAssessmentQuestions);
router.post('/', requireAuth, createAssessment);
router.get('/', requireAuth, listAssessments);

export default router;
